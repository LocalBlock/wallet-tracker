import { http, createConfig } from "wagmi";
import { mainnet, polygon, polygonMumbai, sepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

let connectors=[]
if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID){
  // Add walletConnect connector if env is defined
  connectors.push(walletConnect({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID,
    qrModalOptions: { themeVariables: { "--wcm-z-index": "1500" } },
  }))
}

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, polygonMumbai],
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
