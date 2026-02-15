import { appSettings } from "@/app/appSettings";
import { AddressWallet } from "@prisma/client";

/** Delay function */
export async function wait(duration: number, isFailing = false) {
  return new Promise((resolve, reject) => {
    if (!isFailing) setTimeout(resolve, duration);
    else reject("Wait reject");
  });
}

export function isExpired(lastUpdate: Date, delay: number) {
  const timeSpend = Date.now() - lastUpdate.getTime();
  if (timeSpend > delay) return true;
  return false;
}

/**
 * Display name for an address wallet address
 * @param address Ethereum address
 * @param ens Ens
 * @returns short address 0x1234...1234 or Ens if set
 */
export function displayName(address: string, ens: string | null) {
  if (ens) return ens;
  return address.slice(0, 6) + "..." + address.slice(-4);
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
 * Format balance for a token
 * @param balance
 * @param symbol
 * @returns xx xxx symbol
 */
export function formatBalanceToken(balance: number) {
  const maximumFractionDigits = balance.toFixed().length >= 4 ? 0 : 4;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: maximumFractionDigits,
  }).format(balance);
}

export function formatAPY(percentage: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    style: "percent",
  }).format(percentage);
}

export function getAllIds(addressWallet: AddressWallet) {
  const allIds: string[] = [];
  // Native Tokens
  addressWallet.nativeTokens.forEach((nativeToken) =>
    allIds.push(nativeToken.coinDataId)
  );
  // Tokens
  addressWallet.tokens.forEach((token) => allIds.push(token.coinDataId));

  //Add defiToken Id
  // Safetymodule
  if (addressWallet.defi.aaveSafetyModule.aave.stakeTokenUserBalance != "0")
    allIds.push(addressWallet.defi.aaveSafetyModule.aave.coinDataId);
  if (addressWallet.defi.aaveSafetyModule.bpt.stakeTokenUserBalance != "0")
    allIds.push(addressWallet.defi.aaveSafetyModule.bpt.coinDataId);
  if (addressWallet.defi.aaveSafetyModule.gho.stakeTokenUserBalance != "0")
    allIds.push(addressWallet.defi.aaveSafetyModule.gho.coinDataId);
  // Aave pools
  for (const chain of appSettings.chains) {
    for (const userReserveData of addressWallet.defi.aaveV3[chain.id]
      .userReservesData) {
      allIds.push(userReserveData.coinDataId);
    }
  }
  // Beefy
  addressWallet.defi.beefy.forEach((vault) => {
    vault.tokens.forEach((token) => allIds.push(token.id));
  });
  // Add USDC coin if there is beefy data
  if (addressWallet.defi.beefy.length != 0) allIds.push("usd-coin");

  // Remove duplicate
  return Array.from(new Set(allIds));
}
