import { createConfig, configureChains, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
//import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
//import { LedgerConnector } from "wagmi/connectors/ledger";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
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
      }),
    );
  }
  return createConfig({
    autoConnect: true,
    publicClient,
    webSocketPublicClient,
    connectors: [new MetaMaskConnector({ chains }), ...extraConnectors],
  });
}
