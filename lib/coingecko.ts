import type {
  FetchCoinList,
  FetchCoinMarket,
  FetchCoinPrices,
  SearchResultApi,
} from "@/types";
import { appSettings } from "@/app/appSettings";

export async function fetchCoinList() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/list?include_platform=true",
    { cache: "no-store" }
  );
  const newData = await res.json();

  return newData as FetchCoinList;
}

export async function fetchCoinsMarket(coinIds: string[]) {
  const nbPages = Math.ceil(coinIds.length / 100);
  const coinIdToFetch = coinIds.join(",");
  const result = [];
  for (let page = 1; page <= nbPages; page++) {
    const urlMarket = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIdToFetch}&order=market_cap_desc&per_page=100&page=${page}&sparkline=true`;
    const resMarket = await fetch(urlMarket);
    if (resMarket.ok) {
      result.push(...(await resMarket.json()));
    } else {
      throw new Error(
        "CoinGecko Market : " + resMarket.status + " " + resMarket.statusText
      );
    }
  }
  return result as FetchCoinMarket[];
}

export async function fetchCoinsPrice(coinIds: string[]) {
  const coinIdToFetch = coinIds.join(",");
  const currencies = appSettings.currencies
    .map((currency) => currency.id)
    .join(",");
  const urlPrice = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIdToFetch}&vs_currencies=${currencies}&include_24hr_change=true`;
  const resPrice = await fetch(urlPrice);
  if (resPrice.ok) {
    const jsonPrice = await resPrice.json();
    return jsonPrice as FetchCoinPrices;
  } else {
    throw new Error(
      "CoinGecko Price : " + resPrice.status + " " + resPrice.statusText
    );
  }
}

export async function search(query: string) {
  const urlSearch = `https://api.coingecko.com/api/v3/search?query=${query}`;
  const resSearch = await fetch(urlSearch);
  if (resSearch.ok) {
    const jsonSearch = await resSearch.json();
    return jsonSearch as SearchResultApi;
  }
  throw new Error(
    "CoinGecko Search : " + resSearch.status + " " + resSearch.statusText
  );
}
