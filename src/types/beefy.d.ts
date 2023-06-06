/** Beefy vault API
 * https://github.com/beefyfinance/beefy-api/blob/d529da77aa69061586328c244d14ae3777fa6ee3/src/api/vaults/types.ts
 */
export type beefyVault = {
  id: string;
  name: string;
  token: string;
  tokenAddress?: string | null;
  tokenDecimals: number;
  tokenProviderId?: string;
  tokenAmmId?: string;
  earnedToken: string;
  earnedTokenAddress: string;
  earnedTokenDecimals?: number;
  earnedOracleId?: string;
  earnContractAddress: string;
  oracle: "lps" | "tokens";
  oracleId: string;
  status: "active" | "paused" | "eol";
  platformId: string;
  assets?: string[];
  strategyTypeId: string;
  risks: string[];
  addLiquidityUrl?: string;
  removeLiquidityUrl?: string;
  network: string;
  isGovVault?: boolean;
  strategy: string;
  lastHarvest?: number;
  pricePerFullShare: string;
  createdAt: number;
  chain: string;
};

export type beefyApy = { [vaultId: string]: number };

export type beefyLps = {
  [vaultId: string]: {
    price: number;
    tokens: string[];
    balances: string[];
    totalSupply: string;
  };
};
