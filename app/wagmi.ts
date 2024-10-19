import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { mainnet, polygon, polygonMumbai, sepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

export function getConfig() {
  const connectors = [];
  if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID) {
    // Add walletConnect connector if defined
    connectors.push(
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID,
        qrModalOptions: { themeVariables: { "--wcm-z-index": "1500" } },
      })
    );
  }

  return createConfig({
    chains: [mainnet, sepolia, polygon, polygonMumbai],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    // Note : by default wagmi show installed wallets
    connectors,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [polygon.id]: http(),
      [polygonMumbai.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
