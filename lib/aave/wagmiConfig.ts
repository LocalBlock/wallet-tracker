import { http, createConfig } from "@wagmi/core";
import { mainnet, polygon } from "@wagmi/core/chains";

// Wagmi Config for AAVE library
export const config = createConfig({
    chains: [mainnet, polygon],
    transports: {
      [mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_APIKEY}`
      ),
      [polygon.id]: http(
        `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_APIKEY}`
      ),
    },
  });
  