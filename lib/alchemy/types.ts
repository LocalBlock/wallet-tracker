/**
 * The supported networks by Alchemy. Note that some functions are not available
 * on all networks. Please refer to the Alchemy documentation for which APIs are
 * available on which networks
 * {@link https://docs.alchemy.com/alchemy/apis/feature-support-by-chain}
 *
 * @public
 */
export enum Network {
  ETH_MAINNET = "eth-mainnet",
  /** @deprecated */
  ETH_GOERLI = "eth-goerli",
  ETH_SEPOLIA = "eth-sepolia",
  OPT_MAINNET = "opt-mainnet",
  /** @deprecated */
  OPT_GOERLI = "opt-goerli",
  OPT_SEPOLIA = "opt-sepolia",
  ARB_MAINNET = "arb-mainnet",
  /** @deprecated */
  ARB_GOERLI = "arb-goerli",
  ARB_SEPOLIA = "arb-sepolia",
  MATIC_MAINNET = "polygon-mainnet",
  /** @deprecated */
  MATIC_MUMBAI = "polygon-mumbai",
  MATIC_AMOY = "polygon-amoy",
  ASTAR_MAINNET = "astar-mainnet",
  POLYGONZKEVM_MAINNET = "polygonzkevm-mainnet",
  /** @deprecated */
  POLYGONZKEVM_TESTNET = "polygonzkevm-testnet",
  POLYGONZKEVM_CARDONA = "polygonzkevm-cardona",
  BASE_MAINNET = "base-mainnet",
  BASE_GOERLI = "base-goerli",
  BASE_SEPOLIA = "base-sepolia",
  ZKSYNC_MAINNET = "zksync-mainnet",
  ZKSYNC_SEPOLIA = "zksync-sepolia",
  SHAPE_MAINNET = "shape-mainnet",
  SHAPE_SEPOLIA = "shape-sepolia",
  LINEA_MAINNET = "linea-mainnet",
  LINEA_SEPOLIA = "linea-sepolia",
  FANTOM_MAINNET = "fantom-mainnet",
  FANTOM_TESTNET = "fantom-testnet",
  ZETACHAIN_MAINNET = "zetachain-mainnet",
  ZETACHAIN_TESTNET = "zetachain-testnet",
  ARBNOVA_MAINNET = "arbnova-mainnet",
  BLAST_MAINNET = "blast-mainnet",
  BLAST_SEPOLIA = "blast-sepolia",
  MANTLE_MAINNET = "mantle-mainnet",
  MANTLE_SEPOLIA = "mantle-sepolia",
  SCROLL_MAINNET = "scroll-mainnet",
  SCROLL_SEPOLIA = "scroll-sepolia",
  GNOSIS_MAINNET = "gnosis-mainnet",
  GNOSIS_CHIADO = "gnosis-chiado",
  BNB_MAINNET = "bnb-mainnet",
  BNB_TESTNET = "bnb-testnet",
  AVAX_MAINNET = "avax-mainnet",
  AVAX_FUJI = "avax-fuji",
  CELO_MAINNET = "celo-mainnet",
  CELO_ALFAJORES = "celo-alfajores",
  METIS_MAINNET = "metis-mainnet",
  OPBNB_MAINNET = "opbnb-mainnet",
  OPBNB_TESTNET = "opbnb-testnet",
  BERACHAIN_BARTIO = "berachain-bartio",
  SONEIUM_MINATO = "soneium-minato",
}

/** The type of {@link Webhook}. */
export enum WebhookType {
  MINED_TRANSACTION = "MINED_TRANSACTION",
  DROPPED_TRANSACTION = "DROPPED_TRANSACTION",
  ADDRESS_ACTIVITY = "ADDRESS_ACTIVITY",
  NFT_ACTIVITY = "NFT_ACTIVITY",
  NFT_METADATA_UPDATE = "NFT_METADATA_UPDATE",
  GRAPHQL = "GRAPHQL",
}
export type WebhookResponse = {
  data: {
    /** Unique ID for given webhook. */
    id: string;
    /** Network of webhook */
    network: string;
    /** Type of webhook. */
    webhook_type: string;
    /** URL endpoint where webhook is sent */
    webhook_url: string;
    /** true if webhook is active, false if not active */
    is_active: boolean;
    /** Timestamp webhook was created */
    time_created: number;
    /** List of addresses being tracked, null if not address activity webhook. */
    addresses: string[];
    /** Webhook version (v1 or v2) */
    version: string;
    /** Signing key for given webhook. */
    signing_key: string;
  };
};

export type Webhook = {
  /** Unique ID for given webhook. */
  id: string;
  /** Network of webhook */
  network: string;
  /** Type of webhook. */
  type: string;
  /** URL endpoint where webhook is sent */
  url: string;
  /** true if webhook is active, false if not active */
  isActive: boolean;
  /** Timestamp webhook was created */
  timeCreated: Date;
  /** List of addresses being tracked, null if not address activity webhook. */
  addresses: string[];
  /** Webhook version (v1 or v2) */
  version: string;
  /** Signing key for given webhook. */
  signingKey: string;
};

export interface PortfolioAddress {
  /** Array of network identifiers (e.g., eth-mainnet). */
  networks: Network[];

  /** Wallet address. */
  address: string;
}

export interface GetTokensByWalletRequest {
  /** A list of wallet addresses to query. */
  addresses: PortfolioAddress[];

  /** If set to true, returns metadata. */
  withMetadata: boolean;

  /** If set to true, returns token prices. */
  withPrices: boolean;

  /** Whether to include each chain’s native token in the response (e.g. ETH on Ethereum). */
  includeNativeTokens: boolean;

  pageKey?: string;
}

export type GetTokensByWalletResponse = {
  data: {
    tokens: [
      {
        /** The blockchain network (e.g., Ethereum, Polygon) where the token is located. */
        network: string;
        /** The wallet address for which the token data applies. */
        address: string;
        /** Token address. */
        tokenAddress: string | null;
        /** Balance of that particular token. */
        tokenBalance: string;
        /** Optional metadata about the token, potentially including name, symbol, decimals, etc. */
        tokenMetadata?: {
          /**
           * The token's name. Is `null` if the name is not defined in the contract and
           * not available from other sources.
           */
          name: string | null;
          /**
           * The token's symbol. Is `null` if the symbol is not defined in the contract
           * and not available from other sources.
           */
          symbol: string | null;
          /**
           * The number of decimals of the token. Returns `null` if not defined in the
           * contract and not available from other sources.
           */
          decimals: number | null;
          /** URL link to the token's logo. Is `null` if the logo is not available. */
          logo: string | null;
        };
        /** Optional pricing data for the token, such as current value or historical prices. */
        tokenPrices?: [
          {
            /** The currency the price is denominated in (e.g. 'usd'). */
            currency: string;
            /** The price value as a string to preserve precision. */
            value: string;
            /** ISO timestamp of when the price was last updated. */
            lastUpdatedAt: string;
          }
        ];
      }
    ];
    /** A string used for pagination to retrieve additional results if available. */
    pageKey: string;
  };
};
export type AlchemyError = {
  error: { message: string };
};
