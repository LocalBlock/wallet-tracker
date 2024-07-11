import { Socket, Server as NetServer } from "net";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiResponse } from "next";
import { appSettings } from "@/app/appSettings";
import { poolConfig } from "@/lib/aave/poolConfig";
import { stakeConfig } from "@/lib/aave/stakeConfig";
import { Prisma } from "@prisma/client";
import { getUserData } from "@/app/actions/user";
import { Network, WebhookType } from "alchemy-sdk";

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Prisma strong typed jsonField
// https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#using-prisma-json-types-generator
declare global {
  namespace PrismaJson {
    type NativeTokens = {
      balance: string;
      chain: ChainId;
      coinDataId: string;
    }[];
    type Tokens = {
      contractAddress: string;
      balance: string;
      chain: ChainId;
      coinDataId: string;
    }[];
    type Coins = {
      balance: string;
      coinDataId: string;
    }[];
    type Price = FetchCoinPrices[number];
    type Sparkline_in_7d = FetchCoinMarket["sparkline_in_7d"];
    type Defi = {
      aaveSafetyModule: AaveSafetyModule;
      aaveV2: { [Property in ChainId]: AaveBalance };
      aaveV3: { [Property in ChainId]: AaveBalance };
      beefy: BeefyBalance[];
    };
    type List = FetchCoinList;
    type AssetNotifications = {
      coinDataId?: string;
      toAddress: string;
      fromAddress: string;
      value: number;
      asset: string;
    }[];
  }
}

export type UserWithRelations = NonNullable<
  Prisma.PromiseReturnType<typeof getUserData>
>;

export type WalletType = "AddressWallet" | "CustomWallet";
export type ChainId = (typeof appSettings.chains)[number]["id"];
export type AaveVersions = keyof typeof poolConfig;

export type FetchCoinList = {
  id: string;
  name: string;
  platforms: { [index: string]: string };
  symbol: string;
}[];

export type FetchCoinMarket = {
  /**Coingecko Id Coin */
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: object | null;
  last_updated: Date | null;
  sparkline_in_7d: { price: number[] };
};

/**
 * Prices of any crytocurrencies from Coingecko
 */
export type FetchCoinPrices = {
  /** CoinId */
  [index: string]: {
    /** Current Price USD */
    usd: number;
    /** 24 Change % USD */
    usd_24h_change: number;
    /** Current Price EUR */
    eur: number;
    /** 24 Change % EUR */
    eur_24h_change: number;
    /** Current Price BTC */
    btc: number;
    /** 24 Change % BTC */
    btc_24h_change: number;
  };
};

export type SearchResultApi = {
  coins: {
    id: string;
    name: string;
    api_symbol: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    large: string;
  }[];
  exchanges: {
    id: string;
    name: string;
    market_type: string;
    thumb: string;
    large: string;
  }[];
  icos: [];
  categories: { id: number; name: string }[];
  nfts: { id: string; name: string; symbol: string; thumb: string }[];
};

export type AaveSafetyModule = {
  [Property in keyof typeof stakeConfig.tokens]: {
    coinDataId: string;
    decimals: number;
    stakeTokenUserBalance: string;
    userIncentivesToClaim: string;
    stakeApy: string;
  };
};

export type AaveBalance = {
  /**Valeur total sur le protocol */
  netWorthUSD: string;
  userReservesData: {
    coinDataId: string;
    underlyingAsset: string;
    underlyingBalance: string;
    underlyingBalanceUSD: string;
    reserve: {
      name: string;
      symbol: string;
      decimals: number;
      supplyAPY: string;
      supplyAPR: string;
      totalLiquidity: string;
      totalLiquidityUSD: string;
      priceInUSD: string;
      aTokenAddress: string;
    };
  }[];
};

/** Beefy vault API
 * https://github.com/beefyfinance/beefy-api/blob/master/src/api/vaults/types.ts
 */
export type BeefyVault = {
  id: string;
  name: string;
  type: "standard" | "gov";
  token: string;
  tokenAddress?: string | null;
  tokenDecimals: number;
  tokenProviderId?: string;
  tokenAmmId?: string;
  earnedToken: string;
  earnedTokenAddress: string;
  earnedTokenDecimals?: number;
  earnContractAddress: string;
  oracle: "lps" | "tokens";
  oracleId: string;
  status: "active" | "paused" | "eol";
  platformId: string;
  assets?: string[];
  strategyTypeId: string;
  risks: string[];
  addLiquidityUrl?: string;
  removeLiquidityUrl?: string;
  network: string;
  strategy: string;
  lastHarvest?: number;
  pricePerFullShare: string;
  createdAt: number;
  chain: string;
};

export type BeefyApy = { [vaultId: string]: number };

export type BeefyLps = {
  [vaultId: string]: {
    price: number;
    tokens: string[];
    balances: string[];
    totalSupply: string;
  };
};

export type BeefyBalance = {
  id: string;
  name: string;
  chain: string;
  currentBalance: string;
  currentBalanceHarvest: string;
  earnContractAddress: string;
  pricePerFullShare: string;
  lpsPrice: number;
  tokens: {
    id: string;
    contract: string;
  }[];
  apy: number;
};

export type IncomingNotifications = {
  webhookId: string;
  id: string;
  createdAt: Date;
  type: WebhookType;
  event: {
    network: keyof typeof Network;
    activity: {
      fromAddress: string;
      toAddress: string;
      blockNum: string;
      hash: string;
      // converted asset transfer value as a number (raw value divided by contract decimal). Omitted if erc721 transfer or contract decimal is not available
      value: number; //pas avec erc1155
      // Omitted if not an ERC1155 transfer
      erc1155Metadata: { tokenId: string; value: string }[];
      // ETH or the token's symbol. Omitted if not defined in the contract and not available from other sources
      asset: string;
      // The external, internal, erc721, erc1155, erc20, or token category label for the transfer.
      // NOTE: token maps to a transfer of an ERC20 OR ERC721 token
      category: "erc1155" | "token" | "internal" | "external";
      rawContract: {
        rawValue: string;
        address: string; // erc1155 token
        // 	contract decimal (hex string). Omitted if not defined in the contract and not available from other sources.
        decimals: number; //external token
      };
      log: {
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        transactionHash: string;
        transactionIndex: string;
        blockHash: string;
        logIndex: string;
        removed: boolean;
      }; // pas de log en external
    }[];
  };
};
