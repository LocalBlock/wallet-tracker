import { BalanceAPIResult } from "@/app/api/balance/route";
import { AaveAPIResult } from "@/app/api/aave/route";
import { PricesAPIResult } from "@/app/api/prices/route";

/**
 * Fetches balances for a given address.
 *
 * @param address The Ethereum address to fetch the balance for.
 * @returns A promise resolving with the Balance API result.
 */
export async function fetchBalance(addresses: string[]) {
  console.log(`[Fetch] Balance : ${addresses.join(",")}`);
  const response = await fetch(`api/balance?addresses=${addresses.join(",")}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = (await response.json()) as Error;
    throw new Error(err.message, { cause: err.cause });
  }

  return (await response.json()) as BalanceAPIResult;
}

/**
 * Fetches the Aave balance for a given address.
 *
 * @param address The Ethereum address to fetch the balance for.
 * @returns A promise resolving with the Aave API result.
 */
export async function fetchAaveBalance(address: string) {
  console.log(`[Fetch] Aave Balance : ${address}`	);
  const response = await fetch(`api/aave?address=${address}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const err = (await response.json()) as Error;
    throw new Error(err.message, { cause: err.cause });
  }
  return (await response.json()) as AaveAPIResult;
}

/**
 * Fetches Prices from a list of coins.
 *
 * @param coinIds coinIds to fetch.
 * @returns A promise resolving with the Prices API result.
 */
export async function fetchPrices(coinIds: string[]) {
  console.log("[Fetch Prices] ", coinIds);
  const response = await fetch(`api/prices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coinIds),
  });

  if (!response.ok) {
    const err = (await response.json()) as Error;
    if (err.cause) console.error(err.cause);
    throw new Error(err.name + " : " + err.message);
  }
  return (await response.json()) as PricesAPIResult;
}
