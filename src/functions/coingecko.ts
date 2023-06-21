import {
  fetchCoinList,
  fetchCoinMarket,
  fetchCoinPrices,
} from "../types/types";
import { appSettings } from "../settings/appSettings";

/**
 * Fetch coinlist from coingecko API and store in localstorage
 * @returns list of all available coin
 */
export async function getAllCoinID() {
  const url =
    "https://api.coingecko.com/api/v3/coins/list?include_platform=true";
  const lsKeyCg = "coinList";
  const r = await fetchAPI(url);

  const lsCoinlist: { data: fetchCoinList[]; lastFetch: number } = {
    data: r,
    lastFetch: Date.now(),
  };

  localStorage.setItem(lsKeyCg, JSON.stringify(lsCoinlist)); // save in localstorage
}

export async function getCoinMarket(coinID: string) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinID}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h%2C7d%2C30d`;
  const r = await fetchAPI(url);
  return r as fetchCoinMarket[];
}
export async function getCoinPrices(coinID: string) {
  const strCurrencies = appSettings.currencies
    .map((currency) => {
      return currency.id;
    })
    .join();

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinID}&vs_currencies=${strCurrencies}&include_24hr_change=true`;
  const r = await fetchAPI(url);
  return r as fetchCoinPrices;
}

async function fetchAPI(url: string) {
  const r = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });
  if (r.ok) {
    return r.json();
  }
  throw new Error("CoinGecko : " + r.status + " " + r.statusText);
}
