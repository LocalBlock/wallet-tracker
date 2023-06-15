import { Network } from "alchemy-sdk";
import { toMilliseconds } from "../functions/utils";
import { appSettingsType } from "../types/types";

export const appSettings: appSettingsType = {
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
      image: "ethereum-chain-logo.png",
      tokenId: "ethereum",
      tokenDecimals: 18,
      alchemyMainnet: Network.ETH_MAINNET,
      chainIdMainnet: 1,
      alchemyTestnet: Network.ETH_GOERLI,
      chainIdTestnet: 5,
    },
    {
      id: "polygon-pos",
      name: "Polygon",
      image: "polygon-chain-logo.png",
      tokenId: "matic-network",
      tokenDecimals: 18,
      alchemyMainnet: Network.MATIC_MAINNET,
      chainIdMainnet: 137,
      alchemyTestnet: Network.MATIC_MUMBAI,
      chainIdTestnet: 80001,
    },
  ],
  defi: {
    aave: {
      image: "./aave.svg",
      contractAddresses: {
        v2: {
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
        v3: {
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
      image: "./beefy.svg",
    },
  },
  fetchDelayRequest: 1000,
  intervalCheck: toMilliseconds(0, 1),
  fetchDelayCoinList: toMilliseconds(240, 0),
  fetchDelayBalance: toMilliseconds(1, 0),
  fetchDelayPrices: toMilliseconds(0, 10),
  defaultUserSettings: {
    currency: "usd",
    groups: [],
    selectedChain: ["ethereum", "polygon-pos"],
    selectedWallet: { type: "wallet", index: 0 },
  },
};
