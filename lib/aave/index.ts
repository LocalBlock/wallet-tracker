import { getCoinlist } from "@/app/actions/coinData";
import { appSettings } from "@/app/appSettings";
import { AddressWallet } from "@prisma/client";
// Custom version of @aave/contract-helpers which use Wagmi/view instead of ethers@5
import {
  UiPoolDataProvider,
  UiStakeDataProviderV3,
  LegacyUiPoolDataProvider,
} from "./contract-helpers";
// But official version for math :)
import { formatUserSummary, formatReserves } from "@aave/math-utils";
import { poolConfig } from "./poolConfig";
import { stakeConfig } from "./stakeConfig";
import { AaveBalance } from "@/types";
import { queryClientServer } from "../queryClientServer";
import { ReadContractErrorType } from "viem";

export async function fetchAaveSafetyModule(address: string) {
  const stakedTokens = [
    stakeConfig.tokens["aave"].TOKEN_STAKING,
    stakeConfig.tokens["bpt"].TOKEN_STAKING,
    stakeConfig.tokens["gho"].TOKEN_STAKING,
  ];
  const oracles = [
    stakeConfig.tokens["aave"].TOKEN_ORACLE,
    stakeConfig.tokens["bpt"].TOKEN_ORACLE,
    stakeConfig.tokens["gho"].TOKEN_ORACLE,
  ];
  const user = address;

  try {
    const stakeDataProviderContract = new UiStakeDataProviderV3({
      uiStakeDataProvider: stakeConfig.stakeDataProvider,
    });
    console.log(`\x1b[36m[Fetch]\x1b[0m generalStakeUIData`);
    // Fetch generalStakeUIData with a staletime, only 1 call for all user's addresses
    const generalStakeUIData = await queryClientServer.fetchQuery({
      queryKey: ["generalStakeUIData"],
      queryFn: () =>
        stakeDataProviderContract.getStakedAssetDataBatch(
          stakedTokens,
          oracles
        ),
      staleTime: 60_000, // 60 seconds
    });
    console.log(`\x1b[36m[Fetch]\x1b[0m userStakeUIData`);
    const userStakeUIData =
      await stakeDataProviderContract.getUserStakeUIDataHumanized({
        user,
        stakedAssets: stakedTokens,
        oracles,
      });

    // Build result
    const result: AddressWallet["defi"]["aaveSafetyModule"] = {
      aave: {
        coinDataId: "aave",
        decimals: 18,
        stakeTokenUserBalance:
          userStakeUIData.stakeUserData[0].stakeTokenUserBalance,
        userIncentivesToClaim:
          userStakeUIData.stakeUserData[0].userIncentivesToClaim,
        stakeApy: generalStakeUIData.stakeData[0].stakeApy,
      },
      bpt: {
        coinDataId: "aave-balancer-pool-token",
        decimals: 18,
        stakeTokenUserBalance:
          userStakeUIData.stakeUserData[1].stakeTokenUserBalance,
        userIncentivesToClaim:
          userStakeUIData.stakeUserData[1].userIncentivesToClaim,
        stakeApy: generalStakeUIData.stakeData[1].stakeApy,
      },
      gho: {
        coinDataId: "gho",
        decimals: 18,
        stakeTokenUserBalance:
          userStakeUIData.stakeUserData[2].stakeTokenUserBalance,
        userIncentivesToClaim:
          userStakeUIData.stakeUserData[2].userIncentivesToClaim,
        stakeApy: generalStakeUIData.stakeData[2].stakeApy,
      },
    };

    return result;
  } catch (error: any) {
    if (error.name === "Error") {
      //Standard Error
      const errorStd = error as Error;
      console.error(errorStd.message);
    } else {
      // Viem Error
      const errorViem = error as ReadContractErrorType;
      console.error(errorViem.shortMessage);
    }
    throw new Error(error);
  }
}

export async function fetchAavePools(address: string) {
  const coinlist = await getCoinlist();

  const result: {
    aaveV2: AddressWallet["defi"]["aaveV2"];
    aaveV3: AddressWallet["defi"]["aaveV3"];
  } = {
    aaveV2: {
      ethereum: { netWorthUSD: "0", userReservesData: [] },
      "polygon-pos": { netWorthUSD: "0", userReservesData: [] },
    },
    aaveV3: {
      ethereum: { netWorthUSD: "0", userReservesData: [] },
      "polygon-pos": { netWorthUSD: "0", userReservesData: [] },
    },
  };
  // User address to fetch data for
  const user = address;

  // Get versions from appSetting poolConfig object
  const versions = Object.keys(poolConfig) as (keyof typeof poolConfig)[];

  try {
    for await (const version of versions) {
      console.group(version);
      // Get chains from appSetting poolConfig object
      for await (const chain of appSettings.chains) {
        console.group(chain.name);
        // Check if chain exist in pool config
        if (poolConfig[version][chain.id]) {
          //Contract address
          const uiPoolDataProviderAddress =
            poolConfig[version][chain.id].uiPoolDataProviderAddress;
          const lendingPoolAddressProvider =
            poolConfig[version][chain.id].lendingPoolAddressProvider;

          // View contract used to fetch all reserves data (including market base currency data), and user reserves
          // Use UiPoolDataProvider for AaveV3 otherwise use LegacyUiPoolDataProvider
          const poolDataProviderContract =
            version === "aaveV3"
              ? new UiPoolDataProvider({
                  uiPoolDataProviderAddress,
                  chainId: chain.chainIdMainnet,
                })
              : new LegacyUiPoolDataProvider({
                  uiPoolDataProviderAddress,
                  chainId: chain.chainIdMainnet,
                });

          // Fetch reserves with a staletime, only 1 call for all user's addresses
          console.log(`\x1b[36m[Fetch]\x1b[0m Reserves`);
          const reserves = await queryClientServer.fetchQuery({
            queryKey: ["reserves", version, chain.id],
            queryFn: () =>
              poolDataProviderContract.getReservesHumanized({
                lendingPoolAddressProvider,
              }),
            staleTime: 60_000, //60 seconds
          });
          console.log(`\x1b[36m[Fetch]\x1b[0m User Reserves`);
          const userReserves =
            await poolDataProviderContract.getUserReservesHumanized({
              lendingPoolAddressProvider,
              user,
            });

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
          const userReservesData: AaveBalance["userReservesData"] = [];
          userSummary.userReservesData.forEach((data) => {
            const cl = coinlist.find(
              (cl) => cl.platforms[chain.id] === data.underlyingAsset
            );
            if (data.underlyingBalance != "0" && cl) {
              // Push reserveData with non-zero balance and with a finded id from coinlist
              userReservesData.push({
                coinDataId: cl.id,
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
          const balance = {
            netWorthUSD: userSummary.netWorthUSD,
            userReservesData: userReservesData,
          };

          // put balance in result main object
          result[version][chain.id] = balance;
        }
        console.groupEnd();
      }
      console.groupEnd();
    }
  } catch (error: any) {
    if (error.name === "Error") {
      //Standard Error
      const errorStd = error as Error;
      console.error(errorStd.message);
    } else {
      // Viem Error
      const errorViem = error as ReadContractErrorType;
      console.error(errorViem.shortMessage);
    }
    console.groupEnd();
    console.groupEnd();
    throw new Error(error);
  }
  return result;
}
