import { ethers } from "ethers";
import { UiPoolDataProvider } from "@aave/contract-helpers";
import { formatUserSummary, formatReserves } from "@aave/math-utils";
import { appSettings } from "../settings/appSettings";
import { aaveBalance } from "../types/types";

export async function fetchAave(
  address: string,
  version: "v2" | "v3",
  chain: (typeof appSettings.chains)[number]
) {
  const rpcUrl = `/alchemyfetch?network=${chain.alchemyMainnet}`;
  // User address to fetch data for
  const user = address;
  // This is the provider used in Aave UI, it checks the chainId locally to reduce RPC calls with frequent network switches, but requires that the rpc url and chainId to remain consistent with the request being sent from the wallet (i.e. actively detecting the active chainId)
  const provider = new ethers.providers.StaticJsonRpcProvider(
    rpcUrl,
    chain.chainIdMainnet
  );

  //Contract address
  const uiPoolDataProviderAddress =
    appSettings.defi.aave.contractAddresses[version][chain.id]
      .uiPoolDataProviderAddress;
  //   const uiIncentiveDataProviderAddress =
  //     appSettings.aaveContractAddresses[version][chain.id]
  //       .uiIncentiveDataProviderAddress;
  const lendingPoolAddressProvider =
    appSettings.defi.aave.contractAddresses[version][chain.id]
      .lendingPoolAddressProvider;

  // View contract used to fetch all reserves data (including market base currency data), and user reserves
  const poolDataProviderContract = new UiPoolDataProvider({
    uiPoolDataProviderAddress,
    provider,
    chainId: chain.chainIdMainnet,
  });
  // View contract used to fetch all reserve incentives (APRs), and user incentives
  //   const incentiveDataProviderContract = new UiIncentiveDataProvider({
  //     uiIncentiveDataProviderAddress,
  //     provider,
  //     chainId: chain.chainIdMainnet,
  //   });
  // Object containing array of pool reserves and market base currency data
  // { reservesArray, baseCurrencyData }
  const reserves = await poolDataProviderContract.getReservesHumanized({
    lendingPoolAddressProvider,
  });

  // Object containing array or users aave positions and active eMode category
  // { userReserves, userEmodeCategoryId }
  const userReserves = await poolDataProviderContract.getUserReservesHumanized({
    lendingPoolAddressProvider,
    user,
  });
  //console.log(userReserves);

  const reservesArray = reserves.reservesData;
  const baseCurrencyData = reserves.baseCurrencyData;
  const userReservesArray = userReserves.userReserves;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const formattedReserves = formatReserves({
    reserves: reservesArray,
    currentTimestamp,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    marketReferencePriceInUsd:
      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
  });
  /*
      - @param `currentTimestamp` Current UNIX timestamp in seconds, Math.floor(Date.now() / 1000)
      - @param `marketReferencePriceInUsd` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferencePriceInUsd`
      - @param `marketReferenceCurrencyDecimals` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferenceCurrencyDecimals`
      - @param `userReserves` Input from [Fetching Protocol Data](#fetching-protocol-data), combination of `userReserves.userReserves` and `reserves.reservesArray`
      - @param `userEmodeCategoryId` Input from [Fetching Protocol Data](#fetching-protocol-data), `userReserves.userEmodeCategoryId`
      */
  const userSummary = formatUserSummary({
    currentTimestamp,
    marketReferencePriceInUsd:
      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    userReserves: userReservesArray,
    formattedReserves,
    userEmodeCategoryId: userReserves.userEmodeCategoryId,
  });

  // User reserveData
  const userReservesData: aaveBalance["userReservesData"] = [];
  userSummary.userReservesData.forEach((data) => {
    if (data.underlyingBalance != "0") {
      // Push reserveData with non-zero balance
      userReservesData.push({
        id: "",
        image: "",
        prices: {
          usd: 0,
          usd_24h_change: 0,
          eur: 0,
          eur_24h_change: 0,
          btc: 0,
          btc_24h_change: 0,
        },
        sparkline_in_7d: { price: [] },
        underlyingAsset: data.underlyingAsset,
        underlyingBalance: data.underlyingBalance,
        underlyingBalanceUSD: data.underlyingBalanceUSD,
        reserve: {
          name: data.reserve.name,
          symbol: data.reserve.symbol,
          decimals: data.reserve.decimals,
          supplyAPY: data.reserve.supplyAPY,
          supplyAPR: data.reserve.supplyAPR,
          totalLiquidity: data.reserve.totalLiquidity,
          totalLiquidityUSD: data.reserve.totalLiquidityUSD,
          priceInUSD: data.reserve.priceInUSD,
          aTokenAddress: data.reserve.aTokenAddress,
        },
      });
    }
  });

  return {
    netWorthUSD: userSummary.netWorthUSD,
    userReservesData: userReservesData,
  };
}
