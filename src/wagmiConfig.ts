import { createConfig, configureChains } from "wagmi";
import { mainnet, goerli, polygon, polygonMumbai } from "viem/chains";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
//import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
//import { LedgerConnector } from "wagmi/connectors/ledger";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, goerli, polygon, polygonMumbai],
  [publicProvider()]
);

export function setMyWagmiConfig(projectId: string) {
  const extraConnectors = [];
  if (projectId) {
    extraConnectors.push(
      new WalletConnectConnector({
        options: {
          projectId,
        },
      })
    );
  }
  return createConfig({
    autoConnect: true,
    publicClient,
    webSocketPublicClient,
    connectors: [
      new MetaMaskConnector({ chains }),
      new InjectedConnector({ chains, options: { name: "Others Wallets" } }),
      ...extraConnectors,
    ],
  });
}
