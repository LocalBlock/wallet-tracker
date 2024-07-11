import { Network } from "alchemy-sdk";

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
    aave: {
      image: "aave.svg",
    },
    beefy: {
      image: "beefy.svg",
    },
  },
} as const;
