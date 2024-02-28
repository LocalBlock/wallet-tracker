"use server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { appSettings } from "../appSettings";
import { AaveBalance, BeefyBalance, ChainId } from "@/types";
import { formatUnits } from "viem";
import { AddressWallet, CoinData } from "@prisma/client";

export async function getTokens(selectedWalletId: string[]) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // ADDRESS WALLETS
  const addressWalletsUserDb = await db.addressWallet.findMany({
    where: {
      users: { some: { address: session.address } },
      address: { in: selectedWalletId },
    },
  });

  // Merge native tokens between wallet
  const mergeNativeTokens = addressWalletsUserDb
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
  const mergeTokens = addressWalletsUserDb
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
  const customWalletsUserDb = await db.customWallet.findMany({
    where: { userAddress: session.address, id: { in: selectedWalletId } },
  });

  // Merge Coins between Wallet, add property chain:null
  const mergeCoins = customWalletsUserDb
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
  const coinsData = await db.coinData.findMany();
  const allAsset = [...mergeNativeTokens, ...mergeTokens, ...mergeCoins].map(
    (asset) => {
      // Coin data must exist
      const coinData = coinsData.find((cd) => cd.id === asset.coinDataId)!;

      return {
        ...asset,
        name: coinData.name,
        symbol: coinData.symbol,
        image: coinData.image,
        price: coinData.price,
        sparkline_in_7d: coinData.sparkline_in_7d,
      };
    }
  );

  return allAsset;
}

export async function getDefi(selectedWalletId: string[]) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  const addressWalletsUserDb = await db.addressWallet.findMany({
    where: {
      users: { some: { address: session.address } },
      address: { in: selectedWalletId },
    },
  });

  const coinsData = await db.coinData.findMany();

  // AAVE SAFETY MODULE
  const mergedSafetyModule = addressWalletsUserDb
    .map((aw) => aw.defi.aaveSafetyModule)
    .reduce((acc, currentValue) => {
      Object.keys(acc).forEach((stakedTokenStr) => {
        const stakedToken =
          stakedTokenStr as keyof typeof appSettings.defi.aave.stakeConfig.tokens;

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
      return {
        ...safetyModule,
        name: cd.name,
        symbol: cd.symbol,
        image: cd.image,
        balance: formattedStakeTokenUserBalance,
        // Safety module is only ethereum
        chain: "ethereum",
        price: cd.price,
        sparkline_in_7d: cd.sparkline_in_7d,
      };
    });

  // AAVE POOLS
  // merge one version
  function mergeAavePoolsVersion(
    aave: AddressWallet["defi"]["aaveV2"][] | AddressWallet["defi"]["aaveV3"][]
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

  const mergedAavePoolsV2Array = mergeAavePoolsVersion(
    addressWalletsUserDb.map((aw) => aw.defi.aaveV2)
  );

  const mergedAavePoolsV3Array = mergeAavePoolsVersion(
    addressWalletsUserDb.map((aw) => aw.defi.aaveV3)
  );

  // BEEFY
  type TokenWithData = BeefyBalance["tokens"][number] & {
    image: string;
    name: string;
  };

  const mergedBeefyVaults = addressWalletsUserDb
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
    aaveV2: mergedAavePoolsV2Array,
    aaveV3: mergedAavePoolsV3Array,
    beefy: mergedBeefyVaults,
  };
}
