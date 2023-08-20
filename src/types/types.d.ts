import { Network } from "alchemy-sdk";
import { Wallet } from "../classes/Wallet";
import { WebhookWithAddresses } from "../components/WebhooksSetting";

export interface aaveBalance {
  /**Valeur total sur le protocol */
  netWorthUSD: string;
  userReservesData: {
    /** Coingecko ID */
    id: string;
    /** CoinGecko Image */
    image: string;
    /** Prices for underlying asset from Coingecko endpoint: /simple/price */
    prices: prices;
    sparkline_in_7d: { price: number[] };
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
}

export interface beefyBalance {
  id: string;
  name: string;
  chain: string;
  currentBalance: string;
  currentBalanceHarvest: string;
  earnContractAddress: string;
  pricePerFullShare: string;
  price?: number;
  /** Prices from USDC Token */
  defaultPrices?: prices;
  tokens: {
    id: string;
    contract: string;
    image: string;
    /** Prices of token from coingecko */
    prices: prices;
  }[];
  apy: number;
}
/**
 * Prices from Coingecko endpoint: /simple/price
 */
export interface prices {
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
}

export interface fetchCoinList {
  id: string;
  name: string;
  platforms: { [index?: string]: string };
  symbol: string;
}
export interface fetchCoinMarket {
  /**Coingecko Id Coin */
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap?: number;
  market_cap_rank?: number;
  fully_diluted_valuation?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  market_cap_change_24h?: number;
  market_cap_change_percentage_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number | null;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  roi?: object | null;
  last_updated?: string;
  sparkline_in_7d: { price: number[] };
}
/**
 * Prices of any crytocurrencies from Coingecko
 */
export interface fetchCoinPrices {
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
}

/**
 * User Settings
 */
export interface userSettings {
  web3UserId: string;
  webhooks: WebhookWithAddresses[];
  /** Display currency */
  currency: string;
  selectedChain: appSettingsType["chains"][number]["id"][];
  selectedWallet: { type: "wallet" | "group"; index: number };
  groups: {
    name: string;
    wallets: Wallet["id"][];
  }[];
}

/** Application settings */
export interface appSettingsType {
  /**Supported Currencies for calculation of balance */
  currencies: {
    /**Id from Coingecko */
    id: string;
    /**Name of currency */
    name: string;
    /**Symbol */
    symbol: string;
    /**Currency code (Alphabetic code iso 4217) for formating number */
    currencyCode: string;
  }[];

  /** Supported Chains*/
  chains: {
    /** ChainId from Coingecko */
    id: "ethereum" | "polygon-pos";
    /** Name of chain */
    name: string;
    /** Coingecko ID for the natvive token */
    tokenId: string;
    /** Number of decimals for the native token */
    tokenDecimals: number;
    /** Image of chain */
    image: string;
    /** Mainnet network from Alchemy*/
    alchemyMainnet: Network;
    /** ChainId Mainnet */
    chainIdMainnet: number;
    /**Testnet network from Alchemy */
    alchemyTestnet: Network;
    /** ChainId Testnet */
    chainIdTestnet: number;
  }[];
  defi: {
    aave: {
      image: string;
      contractAddresses: {
        /**
         * Aave protocol version 2 addresses
         */
        v2: {
          [chainId: string]: {
            uiPoolDataProviderAddress: string;
            uiIncentiveDataProviderAddress: string;
            lendingPoolAddressProvider: string;
          };
        };
        /**
         * Aave protocol version 3 addresses
         */
        v3: {
          [chainId: string]: {
            uiPoolDataProviderAddress: string;
            uiIncentiveDataProviderAddress: string;
            lendingPoolAddressProvider: string;
          };
        };
      };
    };
    beefy: {
      image: string;
    };
  };
  /**Delay between each request for fetching API (milliseconds)
   * To prevent limit on Alchemy
   */
  fetchDelayRequest: number;
  /**Delay between each fetchBalance */
  fetchDelayBalance: number;
  /**Delay between each fetchPrices */
  fetchDelayPrices: number;
  /** Delay between each update of coinList from CoinGecko */
  fetchDelayCoinList: number;
  /** Interval of fetching function */
  intervalCheck: number;
  /** Default userSettings, used when there is no usersetting in localstorage */
  defaultUserSettings: userSettings;
}
