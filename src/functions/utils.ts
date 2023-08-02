import { appSettings } from "../settings/appSettings";
import { Token } from "../classes/Token";
import { aaveBalance, appSettingsType, beefyBalance } from "../types/types";
import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";
import { Coin } from "../classes/Coin";
import { getCoinList } from "./localstorage";
/**
 * Format balance for a token
 * @param balance
 * @param symbol
 * @returns xx xxx symbol
 */
export function formatBalanceToken(balance: number, symbol: string) {
  const maximumFractionDigits = balance.toFixed().length >= 4 ? 0 : 4;
  return (
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: maximumFractionDigits,
    }).format(balance) +
    " " +
    symbol
  );
}
/**
 * Format balance in currency for a token
 * @param balance
 * @param currency
 * @returns
 */
export function formatBalanceCurrency(balance: number, currency: string) {
  const selectedCurrency = appSettings.currencies.filter(
    (appCurrency) => appCurrency.id === currency
  )[0];
  const maximumFractionDigits = balance.toFixed().length >= 4 ? 0 : 5;

  if (selectedCurrency.currencyCode === "") {
    // "false" currency eg BTC
    return (
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maximumFractionDigits,
      }).format(balance) +
      " " +
      selectedCurrency.symbol
    );
  } else {
    //Style Currency
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
      style: "currency",
      currency: selectedCurrency.currencyCode,
      currencyDisplay: "narrowSymbol", // '$' instead of '$US'
    }).format(balance);
  }
}
/**
 * Format percentage change and balance change
 * @param percentage
 * @param balance
 * @param currency currency ID
 * @returns +x,xx % (+x xxx €)
 */
export function formatBalanceChange(
  percentage: number,
  balance: number,
  currency: string
) {
  percentage = percentage / 100;

  const percentageFormated = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    style: "percent",
    signDisplay: "exceptZero",
  }).format(percentage);

  const selectedCurrency = appSettings.currencies.filter(
    (appCurrency) => appCurrency.id === currency
  )[0];

  let changeBalance = "";
  if (selectedCurrency.currencyCode) {
    changeBalance = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
      style: "currency",
      currency: selectedCurrency.currencyCode,
      signDisplay: "exceptZero",
      currencyDisplay: "narrowSymbol", // $ instead of $US
    }).format(percentage * balance);
  } else {
    changeBalance =
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 4,
      }).format(percentage * balance) +
      " " +
      selectedCurrency.symbol;
  }

  return percentageFormated + " (" + changeBalance + ")";
}
export function formatAPY(percentage: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(percentage);
}

/** Delay function */
export async function wait(duration: number, isFailing = false) {
  return new Promise((resolve, reject) => {
    if (!isFailing) setTimeout(resolve, duration);
    else reject("Wait reject");
  });
}
/**
 * Convert a duration to milleseconds
 * @param hours Number of hours
 * @param minutes Number of minutes
 * @returns Number of milliseconds
 */
export function toMilliseconds(hours = 0, minutes = 0) {
  return (hours * 60 * 60 + minutes * 60) * 1000;
}

/**
 * Merge tokens from active addresses, remove Atoken if present and no Coingecko ID
 * @param allActiveWallet
 * @returns
 */
export function mergeTokensWallet(
  allActiveWallet: (AddressWallet | Web3Wallet)[]
) {
  const displayTokens: Token[] = [];
  //Merge all token
  let allTokens: Token[] = [];
  allActiveWallet.forEach((activeAddress) => {
    allTokens.push(
      ...activeAddress.tokens.map((token) => {
        //!! Need to create a NEW token Object in order to be indepedent from original token's object address
        const newToken = new Token();
        //console.log(token);
        return Object.assign(newToken, token);
      })
    );
  });
  //Remove tokens with no Id
  allTokens = allTokens.filter((token) => token.id != undefined);

  // Remove aTokens
  let aTokenAddress: string[] = [];
  allActiveWallet.forEach((address) => {
    appSettings.chains.forEach((chain) => {
      //Aave V2
      address.defi.aaveV2[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          aTokenAddress.push(
            userReserveData.reserve.aTokenAddress.toLocaleLowerCase()
          );
        }
      );
      // Aave V3
      address.defi.aaveV3[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          aTokenAddress.push(
            userReserveData.reserve.aTokenAddress.toLocaleLowerCase()
          );
        }
      );
    });
  });
  aTokenAddress = [...new Set(aTokenAddress)];
  allTokens = allTokens.filter(
    (token) => !aTokenAddress.some((aToken) => token.contractAddress === aToken)
  );
  //Group Token
  allTokens.reduce((acc, currentValue) => {
    //Match on Id and Contract
    const index = acc.findIndex(
      (element) =>
        element.id === currentValue.id &&
        element.contractAddress === currentValue.contractAddress
    );
    if (index != -1) {
      const somme = Number(acc[index].balance) + Number(currentValue.balance);
      acc[index].balance = somme.toString();
    } else acc.push(currentValue);
    return acc;
  }, displayTokens);
  return displayTokens;
}

export function mergeCoinsWallet(allActiveCustomWallet: CustomWallet[]) {
  const displayCoins: Coin[] = [];
  //Merge all token
  const allCoins: Coin[] = [];
  allActiveCustomWallet.forEach((activeWallet) => {
    allCoins.push(
      ...activeWallet.coins.map((coin) => {
        //!! Need to create a NEW coin Object in order to be indepedent from original token's object address
        return Object.assign(
          new Coin(coin.id, coin.name, coin.symbol, coin.image, coin.balance),
          coin
        );
      })
    );
  });
  // Group Coin
  allCoins.reduce((acc, currentValue) => {
    //Match on Id and Contract
    const index = acc.findIndex((element) => element.id === currentValue.id);
    if (index != -1) {
      const somme = Number(acc[index].balance) + Number(currentValue.balance);
      acc[index].balance = somme.toString();
    } else acc.push(currentValue);
    return acc;
  }, displayCoins);
  return displayCoins;
}

export function mergeTokensAndCoins(
  allActiveTokens: Token[],
  allActiveCoins: Coin[]
) {
  const allActiveTokensCoins = [...allActiveTokens, ...allActiveCoins];
  const mergeResult: Token[] = [];
  // Group same Coin and token
  allActiveTokensCoins.reduce((acc, currentValue) => {
    //Match on Id and Contract
    const index = acc.findIndex((element) => element.id === currentValue.id);
    if (index != -1) {
      const somme = Number(acc[index].balance) + Number(currentValue.balance);
      acc[index].balance = somme.toString();
      acc[index].chain += "," + "currentValue.chain";
    } else acc.push(currentValue as Token);
    return acc;
  }, mergeResult);
  return mergeResult;
}

export function mergeTokensChain(allTokens: Token[]) {
  const displayTokens: Token[] = [];
  const result = allTokens.reduce((acc, currentValue) => {
    //Match on Id
    const index = acc.findIndex((element) => element.id === currentValue.id);
    if (index != -1) {
      const somme = Number(acc[index].balance) + Number(currentValue.balance);
      acc[index].chain += "," + currentValue.chain;
      acc[index].balance = somme.toString();
    } else acc.push(currentValue);
    return acc;
  }, displayTokens);
  return result;
}

export function mergeAaveToken(
  allActiveWallet: (AddressWallet | Web3Wallet)[]
) {
  const aaveTokens: Token[] = [];
  allActiveWallet.forEach((wallet) => {
    appSettings.chains.forEach((chain) => {
      //Aave V2
      wallet.defi.aaveV2[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          const newToken = new Token();
          newToken.chain = chain.id;
          newToken.name = userReserveData.reserve.name;
          newToken.id = userReserveData.id;
          newToken.image = userReserveData.image;
          newToken.balance = userReserveData.underlyingBalance;
          newToken.sparkline_in_7d = userReserveData.sparkline_in_7d;
          newToken.prices = userReserveData.prices;
          aaveTokens.push(newToken);
        }
      );
      // Aave V3
      wallet.defi.aaveV3[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          const newToken = new Token();
          newToken.chain = chain.id;
          newToken.name = userReserveData.reserve.name;
          newToken.id = userReserveData.id;
          newToken.image = userReserveData.image;
          newToken.balance = userReserveData.underlyingBalance;
          newToken.sparkline_in_7d = userReserveData.sparkline_in_7d;
          newToken.prices = userReserveData.prices;
          aaveTokens.push(newToken);
        }
      );
    });
  });
  return aaveTokens;
}

export function mergeAaveAddresses(
  allActiveWallet: (AddressWallet | Web3Wallet)[],
  version: string,
  chainId: appSettingsType["chains"][number]["id"]
) {
  const aaveData: aaveBalance = {
    netWorthUSD: "0",
    userReservesData: [],
  };

  switch (version) {
    case "V2":
      allActiveWallet.forEach((wallet) => {
        const tempAaveData = wallet.defi.aaveV2[chainId] as aaveBalance;
        aaveData.netWorthUSD = (
          Number(aaveData.netWorthUSD) + Number(tempAaveData.netWorthUSD)
        ).toString();
        aaveData.userReservesData.push(...tempAaveData.userReservesData);
      });
      break;
    case "V3":
      allActiveWallet.forEach((wallet) => {
        const tempAaveData = wallet.defi.aaveV3[chainId] as aaveBalance;
        aaveData.netWorthUSD = (
          Number(aaveData.netWorthUSD) + Number(tempAaveData.netWorthUSD)
        ).toString();
        aaveData.userReservesData.push(...tempAaveData.userReservesData);
      });
      break;
    default:
      //aaveData = {};
      break;
  }

  //Reduce userReservesData
  const reduceArray: aaveBalance["userReservesData"] = [];
  aaveData.userReservesData = aaveData.userReservesData.reduce(
    (acc, currentValue) => {
      //Match on underlyingAsset
      const index = acc.findIndex(
        (element) => element.underlyingAsset === currentValue.underlyingAsset
      );

      if (index != -1) {
        acc[index].underlyingBalance = (
          Number(acc[index].underlyingBalance) +
          Number(currentValue.underlyingBalance)
        ).toString();
        acc[index].underlyingBalanceUSD = (
          Number(acc[index].underlyingBalanceUSD) +
          Number(currentValue.underlyingBalanceUSD)
        ).toString();
      } else acc.push(currentValue);
      return acc;
    },
    reduceArray
  );
  return aaveData;
}

export function mergeBeefyAddresses(
  allActiveAddress: (AddressWallet | Web3Wallet)[]
) {
  let beefyData: beefyBalance[] = [];

  // Merge all vault
  allActiveAddress.forEach((address) => {
    beefyData.push(...address.defi.beefy);
  });

  // Regroup vault by ID and add balances
  const reduceArray: beefyBalance[] = [];
  beefyData = beefyData.reduce((acc, currentValue) => {
    //Match on underlyingAsset
    const index = acc.findIndex((element) => element.id === currentValue.id);

    if (index != -1) {
      acc[index].currentBalance = (
        Number(acc[index].currentBalance) + Number(currentValue.currentBalance)
      ).toString();
      acc[index].currentBalanceHarvest = (
        Number(acc[index].currentBalanceHarvest) +
        Number(currentValue.currentBalanceHarvest)
      ).toString();
    } else acc.push(currentValue);
    return acc;
  }, reduceArray);
  return beefyData;
}

/**
 * For balance chart only, sparkline price fill with 1$
 * @param allActiveAddress
 * @returns Token array object for balanceChart
 */
export function mergeBeefyToken(
  allActiveAddress: (AddressWallet | Web3Wallet)[]
) {
  const beefyTokens: Token[] = [];
  allActiveAddress.forEach((address) => {
    address.defi.beefy.forEach((vault) => {
      const newToken = new Token();
      newToken.chain = vault.chain;
      newToken.id = vault.id;
      newToken.balance = vault.currentBalanceHarvest;
      newToken.sparkline_in_7d = { price: new Array(168).fill(1) };

      if (!vault.price || !vault.defaultPrices) {
        // Single asset balance calcul from token prices
        newToken.prices = vault.tokens[0].prices;
      } else {
        newToken.prices = {
          usd: vault.price,
          usd_24h_change: 0,
          eur: vault.price * vault.defaultPrices.eur,
          eur_24h_change: 0,
          btc: vault.price * vault.defaultPrices.btc,
          btc_24h_change: 0,
        };
      }
      beefyTokens.push(newToken);
    });
  });
  return beefyTokens;
}

/**
 * Get coin ID
 * @param chain
 * @param contractAddress
 * @returns
 */
export function getCoinID(chain: string, contractAddress: string) {
  const coinList = getCoinList();
  if (coinList) {
    const result = coinList.data.find(
      (coin) => coin.platforms[chain] === contractAddress
    );
    if (result) return result.id;
  }
  return undefined
}

export function convertFetchTime(unixTimestamp:number){
  const date= new Date(unixTimestamp)
  return date.toLocaleString()
}