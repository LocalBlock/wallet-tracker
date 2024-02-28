import { Network } from "alchemy-sdk";
import { Stake } from "@aave/contract-helpers";

export const appSettings = {
  fetchDelayCoinList: 30 * 24 * 60 * 60 * 1000, // 30 days
  fetchDelayRequest: 1000, // 1 seconds
  intervalCheck: 2 * 60 * 1000, // 2 minutes,
  fetchDelayBalance: 1 * 60 * 60 * 1000, //1 hour
  fetchDelayPrices: 10 * 60 * 1000, // 10 minutes
  currencies: [
    {
      id: "eur",
      name: "Euro",
      symbol: "€",
      currencyCode: "EUR",
    },
    {
      id: "usd",
      name: "Dollar",
      symbol: "$",
      currencyCode: "USD",
    },
    {
      id: "btc",
      name: "Bitcoin",
      symbol: "₿",
      currencyCode: "",
    },
  ],
  chains: [
    {
      id: "ethereum",
      name: "Ethereum",
      image: "eth-diamond-purple.svg",
      tokenId: "ethereum",
      tokenDecimals: 18,
      alchemyMainnet: Network.ETH_MAINNET,
      chainIdMainnet: 1,
      alchemyTestnet: Network.ETH_GOERLI,
      chainIdTestnet: 5,
      explorerUrl : "https://etherscan.io"

    },
    {
      id: "polygon-pos",
      name: "Polygon",
      image: "polygon_icon_gradient_on_transparent.svg",
      tokenId: "matic-network",
      tokenDecimals: 18,
      alchemyMainnet: Network.MATIC_MAINNET,
      chainIdMainnet: 137,
      alchemyTestnet: Network.MATIC_MUMBAI,
      chainIdTestnet: 80001,
      explorerUrl : "https://polygonscan.com"
    },
  ],
  defi: {
    /**
     * Aave config
     * @see https://github.com/bgd-labs/aave-address-book for an up-to-date registry of all addresses of the Aave ecosystem's smart contracts
     */
    aave: {
      image: "aave.svg",
      /** Stake configuration for Safety module (Only on Ethereum Mainnet)
       * @see https://github.com/aave/interface/blob/main/src/ui-config/stakeConfig.ts for exemple config
       */
      stakeConfig: {
        chainId: 1,
        stakeDataProvider: "0xb12e82DF057BF16ecFa89D7D089dc7E5C1Dc057B", // !! Aave Utilities >=1.24.0
        tokens: {
          [Stake.aave]: {
            TOKEN_STAKING: "0x4da27a545c0c5b758a6ba100e3a049001de870f5", //stkaave token
            STAKING_REWARD_TOKEN: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", // Aave token
            TOKEN_ORACLE: "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9",
          },
          [Stake.bpt]: {
            TOKEN_STAKING: "0xa1116930326D21fB917d5A27F1E9943A9595fb47", // stkabpt token
            STAKING_REWARD_TOKEN: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", //Aave token
            TOKEN_ORACLE: "0x209Ad99bd808221293d03827B86cC544bcA0023b", // abpt Oracle
          },
          [Stake.gho]: {
            TOKEN_STAKING: "0x1a88Df1cFe15Af22B3c4c783D4e6F7F9e0C1885d", // stkgho token
            STAKING_REWARD_TOKEN: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", //Aave token
            TOKEN_ORACLE: "0x3f12643d3f6f874d39c2a4c9f2cd6f2dbac877fc",
          },
        },
      },
      poolConfig: {
        aaveV2: {
          ethereum: {
            uiPoolDataProviderAddress:
              "0x00e50FAB64eBB37b87df06Aa46b8B35d5f1A4e1A",
            uiIncentiveDataProviderAddress:
              "0xD01ab9a6577E1D84F142e44D49380e23A340387d",
            lendingPoolAddressProvider:
              "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
          },
          "polygon-pos": {
            uiPoolDataProviderAddress:
              "0x204f2Eb81D996729829debC819f7992DCEEfE7b1",
            uiIncentiveDataProviderAddress:
              "0x645654D59A5226CBab969b1f5431aA47CBf64ab8",
            lendingPoolAddressProvider:
              "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
          },
        },
        aaveV3: {
          ethereum: {
            uiPoolDataProviderAddress:
              "0x91c0eA31b49B69Ea18607702c5d9aC360bf3dE7d",
            uiIncentiveDataProviderAddress:
              "0x162A7AC02f547ad796CA549f757e2b8d1D9b10a6",
            lendingPoolAddressProvider:
              "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
          },
          "polygon-pos": {
            uiPoolDataProviderAddress:
              "0xC69728f11E9E6127733751c8410432913123acf1",
            uiIncentiveDataProviderAddress:
              "0x874313A46e4957D29FAAC43BF5Eb2B144894f557",
            lendingPoolAddressProvider:
              "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
          },
        },
      },
    },
    beefy: {
      image: "beefy.svg",
    },
  },
} as const;
