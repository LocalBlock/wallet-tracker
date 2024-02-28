"use server";
import { appSettings } from "../appSettings";
import { db } from "@/lib/db";
import {
  fetchCoinList,
  fetchCoinsMarket,
  fetchCoinsPrice,
} from "@/lib/coingecko";
import { isExpired } from "@/lib/utils";

export async function getCoinlist() {
  const coinlist = await db.coinList.findFirst();

  if (coinlist) {
    if (isExpired(coinlist.updatedAt, appSettings.fetchDelayCoinList)) {
      // Fetch new data
      console.log("[DB] Coinlist update");

      const newData = await fetchCoinList();

      //Update db
      const updatedCoinlist = await db.coinList.update({
        where: { id: coinlist.id },
        data: { list: newData },
      });
      return updatedCoinlist.list;
    }
    return coinlist.list;
  } else {
    //Create
    console.log("[DB] Coinlist create");
    const newData = await fetchCoinList();
    const newCoinlist = await db.coinList.create({ data: { list: newData } });
    return newCoinlist.list;
  }
}

// COINDATA
export async function createCoinData(coinIds: string[]) {
  console.log(`[Fetch] new CoinData`,coinIds.length);

  // Fetch Market
  const newDataMarket = await fetchCoinsMarket(coinIds);
  //Fetch price
  const newDataPrice = await fetchCoinsPrice(coinIds);
  // New Data for Prisma
  const newData = newDataMarket.map((dataMarket) => {
    return {
      id: dataMarket.id,
      name: dataMarket.name,
      symbol: dataMarket.symbol,
      image: dataMarket.image,
      last_updated: dataMarket.last_updated,
      sparkline_in_7d: dataMarket.sparkline_in_7d,
      price: newDataPrice[dataMarket.id],
    };
  });
  await db.coinData.createMany({ data: newData });
  //return updated allCoinData
  return db.coinData.findMany();
}

export async function getExpiredCoinDataIds(coinIds: string[]) {
  const currentCoinsData = await db.coinData.findMany();
  let coinIdsToFetch: string[] = [];

  currentCoinsData.forEach((coinData) => {
    if (
      coinIds.includes(coinData.id) &&
      isExpired(coinData.updatedAt, appSettings.fetchDelayPrices)
    ) {
      coinIdsToFetch.push(coinData.id);
    }
  });

  return coinIdsToFetch;
}

export async function updateCoinData(coinIds: string[]) {
  try {
    // Fetch Market
    const newDataMarket = await fetchCoinsMarket(coinIds);
    //Fetch price
    const newDataPrice = await fetchCoinsPrice(coinIds);

    // update Coins
    console.log(`[Fetch] CoinData`,coinIds.length);
    for await (const id of coinIds) {
      const newCoinData = newDataMarket.find(
        (coinMarketData) => coinMarketData.id === id
      )!;

      await db.coinData.update({
        where: { id: newCoinData.id },
        data: {
          name: newCoinData.name,
          symbol: newCoinData.symbol,
          image: newCoinData.image,
          last_updated: newCoinData.last_updated,
          sparkline_in_7d: newCoinData.sparkline_in_7d,
          price: newDataPrice[id],
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
}

export async function getCoinsData() {
  return await db.coinData.findMany();
}

export async function getContractData() {
  return await db.contractData.findMany();
}

export async function createContractData(data: {
  chainId: string;
  address: string;
  decimals: number | null;
  name: string | null;
  symbol: string | null;
}) {
  await db.contractData.create({ data });
}
