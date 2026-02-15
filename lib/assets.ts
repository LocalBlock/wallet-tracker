import { AddressWallet, CoinData, CustomWallet } from "@prisma/client";
import { stakeConfig } from "./aave/stakeConfig";
import { formatUnits } from "viem";
import { AaveBalance, BeefyBalance, ChainId } from "@/types";
/**
 * Merge tokens/coins asset between wallets (addressWallet/customWallet) and add coins Data (prices)
 * @param selectedAddressWallets Selected address wallets array
 * @param selectedCustomWallets Selected custom wallets array
 * @returns All user assets
 */
export function getUserAssets(
  selectedAddressWallets: AddressWallet[],
  selectedCustomWallets: CustomWallet[],
  coinsData: CoinData[]
) {
  // ADDRESS WALLETS
  // Merge native tokens between wallet
  const mergeNativeTokens = selectedAddressWallets
    .map((aw) => aw.nativeTokens)
    .reduce((acc, currentValue) => {
      currentValue.forEach((cv) => {
        const indexAcc = acc.findIndex(
          (a) => a.coinDataId === cv.coinDataId && a.chain === cv.chain
        );
        if (indexAcc != -1) {
          acc[indexAcc].balance = (
            Number(acc[indexAcc].balance) + Number(cv.balance)
          ).toString();
        } else {
          acc.push({ ...cv }); // Important need to push a NEW object, otherwise mutate original
        }
      });

      return acc;
    }, []);

  // Merge tokens between wallets
  const mergeTokens = selectedAddressWallets
    .map((wallet) => wallet.tokens)
    .reduce((acc, currentValue) => {
      currentValue.forEach((cv) => {
        const indexAcc = acc.findIndex(
          (a) => a.coinDataId === cv.coinDataId && a.chain === cv.chain
        );
        if (indexAcc != -1) {
          acc[indexAcc].balance = (
            Number(acc[indexAcc].balance) + Number(cv.balance)
          ).toString();
        } else {
          acc.push({ ...cv });
        }
      });

      return acc;
    }, []);

  // CUSTOM WALLETS
  // Merge Coins between Wallet, add property chain:null
  const mergeCoins = selectedCustomWallets
    .map((wallet) => wallet.coins)
    .reduce((acc, currentValue) => {
      currentValue.forEach((cv) => {
        const indexAcc = acc.findIndex((a) => a.coinDataId === cv.coinDataId);
        if (indexAcc != -1) {
          acc[indexAcc].balance = (
            Number(acc[indexAcc].balance) + Number(cv.balance)
          ).toString();
        } else {
          acc.push({ ...cv });
        }
      });

      return acc;
    }, [])
    .map((coin) => {
      return { ...coin, chain: "custom" };
    });

  // add coinData
  const allAsset: {
    chain: string;
    balance: string;
    coinDataId: string;
    name: string;
    symbol: string;
    image: string;
    price: (typeof coinsData)[number]["price"];
    sparkline_in_7d: (typeof coinsData)[number]["sparkline_in_7d"];
  }[] = [];

  [...mergeNativeTokens, ...mergeTokens, ...mergeCoins].forEach((asset) => {
    const coinData = coinsData.find((cd) => cd.id === asset.coinDataId);
    // add asset only if coindata exist
    if (coinData)
      allAsset.push({
        ...asset,
        name: coinData.name,
        symbol: coinData.symbol,
        image: coinData.image,
        price: coinData.price,
        sparkline_in_7d: coinData.sparkline_in_7d,
      });
  });

  return allAsset;
}

/**
 * Merge defi asset between wallets and add coins Data (prices)
 * @param selectedAddressWallets
 * @param coinsData
 * @returns All user defi
 */
export function getUserDefi(
  selectedAddressWallets: AddressWallet[],
  coinsData: CoinData[]
) {
  //No addressWallets, probably a custom wallet, return an empty defi object
  if (selectedAddressWallets.length === 0)
    return {
      aaveSafetymodule: [],
      aaveV3: [],
      beefy: [],
    };

  // AAVE SAFETY MODULE
  // Deep cloning object with Json.parse() and Json.Stringify(), to avoid mutate original object
  const selectedAddressWalletsClone = JSON.parse(
    JSON.stringify(selectedAddressWallets)
  ) as typeof selectedAddressWallets;

  const mergedSafetyModule = selectedAddressWalletsClone
    .map((aw) => aw.defi.aaveSafetyModule)
    .reduce((acc, currentValue) => {
      Object.keys(acc).forEach((stakedTokenStr) => {
        const stakedToken = stakedTokenStr as keyof typeof stakeConfig.tokens;

        acc[stakedToken].stakeTokenUserBalance = (
          BigInt(acc[stakedToken].stakeTokenUserBalance) +
          BigInt(currentValue[stakedToken].stakeTokenUserBalance)
        ).toString();
        acc[stakedToken].userIncentivesToClaim = (
          BigInt(acc[stakedToken].userIncentivesToClaim) +
          BigInt(currentValue[stakedToken].userIncentivesToClaim)
        ).toString();
      });
      return acc;
    });

  const mergedSafetyModuleArray = Object.values(mergedSafetyModule)
    .filter((sm) => sm.stakeTokenUserBalance != "0")
    .map((safetyModule) => {
      // CoinData must exist!
      const cd = coinsData.find((cd) => cd.id === safetyModule.coinDataId)!;
      const formattedStakeTokenUserBalance = Number(
        formatUnits(
          BigInt(safetyModule.stakeTokenUserBalance),
          safetyModule.decimals
        )
      );
      // Incentives => Aave Token
      const formatteduserIncentivesToClaim = Number(
        formatUnits(BigInt(safetyModule.userIncentivesToClaim), 18)
      );
      return {
        ...safetyModule,
        name: cd.name,
        symbol: cd.symbol,
        image: cd.image,
        balance: formattedStakeTokenUserBalance,
        balanceToClaim: formatteduserIncentivesToClaim,
        // Safety module is only ethereum
        chain: "ethereum",
        price: cd.price,
        sparkline_in_7d: cd.sparkline_in_7d,
      };
    });

  // AAVE POOLS
  /**
   * Merge Aave pool for on version
   * @param aave
   * @returns
   */
  function mergeAavePoolsVersion(
    aave: AddressWallet["defi"]["aaveV3"][]
  ) {
    // Deep cloning object with Json.parse() and Json.Stringify(), to avoid mutate original object
    const aaveClone = JSON.parse(JSON.stringify(aave)) as typeof aave;

    //Merge
    const mergedVersion = aaveClone.reduce((acc, currentValue) => {
      Object.keys(acc).forEach((chainStr) => {
        const chain = chainStr as ChainId;
        acc[chain].netWorthUSD = (
          Number(acc[chain].netWorthUSD) +
          Number(currentValue[chain].netWorthUSD)
        ).toString();
        currentValue[chain].userReservesData.forEach((cUsr) => {
          const findUsr = acc[chain].userReservesData.find(
            (aUsr) => aUsr.coinDataId === cUsr.coinDataId
          );
          if (findUsr) {
            findUsr.underlyingBalance = (
              Number(findUsr.underlyingBalance) + Number(cUsr.underlyingBalance)
            ).toString();
            findUsr.underlyingBalanceUSD = (
              Number(findUsr.underlyingBalanceUSD) +
              Number(cUsr.underlyingBalanceUSD)
            ).toString();
          } else {
            acc[chain].userReservesData.push(cUsr);
          }
        });
      });
      return acc;
    });

    const finalArray: (AaveBalance["userReservesData"][number] & {
      name: string;
      symbol: string;
      image: string;
      chain: string;
      price: CoinData["price"];
      sparkline_in_7d: CoinData["sparkline_in_7d"];
    })[] = [];

    Object.entries(mergedVersion).forEach(([chain, aaveBalance]) => {
      aaveBalance.userReservesData.forEach((token) => {
        // CoinData must exist!
        const cd = coinsData.find((cd) => cd.id === token.coinDataId)!;
        finalArray.push({
          ...token,
          name: cd.name,
          symbol: cd.symbol,
          image: cd.image,
          chain,
          price: cd.price,
          sparkline_in_7d: cd.sparkline_in_7d,
        });
      });
    });
    return finalArray;
  }

  const mergedAavePoolsV3Array = mergeAavePoolsVersion(
    selectedAddressWallets.map((aw) => aw.defi.aaveV3)
  );

  // BEEFY
  type TokenWithData = BeefyBalance["tokens"][number] & {
    image: string;
    name: string;
  };

  const mergedBeefyVaults = selectedAddressWallets
    .map((aw) => aw.defi.beefy)
    .flat()
    .reduce((acc, currentValue) => {
      const index = acc.findIndex((v) => v.id === currentValue.id);
      if (index != -1) {
        //merge
        acc[index].currentBalance = (
          Number(acc[index].currentBalance) +
          Number(currentValue.currentBalance)
        ).toString();
        acc[index].currentBalanceHarvest = (
          Number(acc[index].currentBalanceHarvest) +
          Number(currentValue.currentBalanceHarvest)
        ).toString();
      } else {
        acc.push(currentValue);
      }

      return [...acc];
    }, [] as BeefyBalance[])
    .map((vault) => {
      // Warning to confirm !!!!!!
      // if price = 0, it is a vault with single token
      // Update price whith the first token?
      if (vault.lpsPrice === 0) {
        const coinData = coinsData.find((cd) => cd.id === vault.tokens[0].id)!;
        const tokenWithData: TokenWithData = {
          ...vault.tokens[0],
          image: coinData.image,
          name: coinData.name,
        };
        return {
          ...vault,
          price: coinData.price,
          sparkline_in_7d: coinData.sparkline_in_7d,
          tokens: [tokenWithData],
        };
      } else {
        //bordel! we build a  special price object because there is no coingecko price with with lp vault
        // of course no 24h change avalaible
        //take price from usd-coin and convert
        // USDC Coin must exist
        const usdCoinData = coinsData.find((cd) => cd.id === "usd-coin")!;
        const price = {
          usd: vault.lpsPrice,
          usd_24h_change: 0,
          eur: vault.lpsPrice / usdCoinData.price["eur"],
          eur_24h_change: 0,
          btc: vault.lpsPrice / usdCoinData.price["btc"],
          btc_24h_change: 0,
        };
        // Make a custom sparkline with vault price, constant price
        const sparkline_in_7d = { price: new Array(168).fill(vault.lpsPrice) };

        // add image for each token in vault
        const tokensWithdata = vault.tokens.map((token) => {
          const coinData = coinsData.find((cd) => cd.id === token.id)!;
          return {
            ...token,
            image: coinData.image,
            name: coinData.name,
          };
        });

        return {
          ...vault,
          price,
          sparkline_in_7d,
          tokens: tokensWithdata,
        };
      }
    });

  return {
    aaveSafetymodule: mergedSafetyModuleArray,
    aaveV3: mergedAavePoolsV3Array,
    beefy: mergedBeefyVaults,
  };
}
