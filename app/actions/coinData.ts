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
  console.log(`[Fetch] new CoinData`, coinIds.length);
  try {
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
  } catch (error) {
    console.log("[Fetch] new CoinData", error);
  }
  //return updated allCoinData
  return db.coinData.findMany();
}

/**
 * Update coinsData or create if not exist in db
 * @param coinIds list of coinId to update
 * @param dataMarket market data previously fetched from coingecko
 * @param dataPrice Prices data previously fetched from coingecko
 * @returns All coinsData (not only updated)
 */
export async function updateCoinData({
  coinIds,
  dataMarket,
  dataPrice,
}: {
  coinIds: string[];
  dataMarket: Awaited<ReturnType<typeof fetchCoinsMarket>>;
  dataPrice: Awaited<ReturnType<typeof fetchCoinsPrice>>;
}) {
  try {
    // Update Coins
    console.log(`[Update] CoinData`, coinIds.length);
    for await (const id of coinIds) {
      const findCoinDataMarket = dataMarket.find(
        (coinMarketData) => coinMarketData.id === id
      );
      if (findCoinDataMarket) {
        await db.coinData.upsert({
          where: { id: findCoinDataMarket.id },
          update: {
            name: findCoinDataMarket.name,
            symbol: findCoinDataMarket.symbol,
            image: findCoinDataMarket.image,
            last_updated: findCoinDataMarket.last_updated,
            sparkline_in_7d: findCoinDataMarket.sparkline_in_7d,
            price: dataPrice[id],
          },
          create: {
            id: findCoinDataMarket.id,
            name: findCoinDataMarket.name,
            symbol: findCoinDataMarket.symbol,
            image: findCoinDataMarket.image,
            last_updated: findCoinDataMarket.last_updated,
            sparkline_in_7d: findCoinDataMarket.sparkline_in_7d,
            price: dataPrice[id],
          },
        });
      } else {
        console.log(
          `[Update] CoinData : ${id} not found on dataMarket, skipping update`
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
  // return all coinsData
  return await db.coinData.findMany()
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
