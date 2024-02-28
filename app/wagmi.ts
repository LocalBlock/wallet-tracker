import { http, createConfig } from "wagmi";
import { mainnet, polygon, polygonMumbai, sepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, polygonMumbai],
  ssr: true,
  // Note : by default wagmi show installed wallets
  connectors: [
    walletConnect({
      projectId: "3a6ed85089e5c96137dee8e12647cb9d",
      qrModalOptions: { themeVariables: { "--wcm-z-index": "1500" } },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
});
