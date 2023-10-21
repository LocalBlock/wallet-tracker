import { ethers } from "ethers";
import {
  UiPoolDataProvider,
  UiStakeDataProvider,
  Stake,
} from "@aave/contract-helpers";
import { formatUserSummary, formatReserves } from "@aave/math-utils";
import { appSettings } from "../settings/appSettings";
import { aaveBalance, aaveSafetyModule } from "../types/types";

export async function fetchAaveSafetyModule(address: string) {
  // Stake config for Aave safetymodule (StkAave)
  const stakeConfig = {
    chainId: 1,
    stakeDataProvider: "0x5E045cfb738F01bC73CEAFF783F4C16e8B14090b",
    tokens: {
      [Stake.aave]: {
        TOKEN_STAKING: "0x4da27a545c0c5b758a6ba100e3a049001de870f5", //stkaave token
        STAKING_REWARD_TOKEN: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", // Aave token
        STAKING_HELPER: "0xce0424653fb2fd48ed1b621bdbd60db16b2e388a", // a staking function that allows staking through the EIP2612 capabilities of the AAVE token
        underlyingTokenContract: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", // Aave Token
        decimals:18

      },
      [Stake.bpt]: {
        TOKEN_STAKING: "0xa1116930326D21fB917d5A27F1E9943A9595fb47", // stkabpt token
        STAKING_REWARD_TOKEN: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", //Aave token
        underlyingTokenContract: "0x41a08648c3766f9f9d85598ff102a08f4ef84f84", // Aave Balancer Pool Token (ABPT)
        decimals:18
      },
    },
  };
  // Url to backend
  const rpcUrl = `/alchemyfetch?network=eth-mainnet`;
  // User address to fetch data for
  const user = address;
  // This is the provider used in Aave UI, it checks the chainId locally to reduce RPC calls with frequent network switches, but requires that the rpc url and chainId to remain consistent with the request being sent from the wallet (i.e. actively detecting the active chainId)
  const provider = new ethers.providers.StaticJsonRpcProvider(
    rpcUrl,
    stakeConfig.chainId
  );

  const stakeDataProviderContract = new UiStakeDataProvider({
    uiStakeDataProvider: stakeConfig.stakeDataProvider,
    provider,
  });
  const generalStakeUIData =
    await stakeDataProviderContract.getGeneralStakeUIDataHumanized();
  const userStakeUIData =
    await stakeDataProviderContract.getUserStakeUIDataHumanized({
      user,
    });

  // Build result
  const result:aaveSafetyModule={
    aave:{
      id:"",
      image:"",
      symbol:"stkAAVE",
      decimals:stakeConfig.tokens.aave.decimals,
      name:"Staked Aave",
      prices:{
        usd: 0,
        usd_24h_change: 0,
        eur: 0,
        eur_24h_change: 0,
        btc: 0,
        btc_24h_change: 0,
      },
      sparkline_in_7d:{ price: [] },
      underlyingTokenContract:stakeConfig.tokens.aave.underlyingTokenContract,
      stakeTokenUserBalance:userStakeUIData.aave.stakeTokenUserBalance,
      userIncentivesToClaim:userStakeUIData.aave.userIncentivesToClaim,
      stakeApy:generalStakeUIData.aave.stakeApy,
    },
    bpt:{
      id:"",
      image:"",
      symbol:"ABPT",
      decimals:stakeConfig.tokens.bpt.decimals,
      name:"Aave Balancer Pool Token",
      prices:{
        usd: 0,
        usd_24h_change: 0,
        eur: 0,
        eur_24h_change: 0,
        btc: 0,
        btc_24h_change: 0,
      },
      sparkline_in_7d:{ price: [] },
      underlyingTokenContract:stakeConfig.tokens.bpt.underlyingTokenContract,
      stakeTokenUserBalance:userStakeUIData.bpt.stakeTokenUserBalance,
      userIncentivesToClaim:userStakeUIData.bpt.userIncentivesToClaim,
      stakeApy:generalStakeUIData.bpt.stakeApy,
    },
  }
  return result;
}

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
