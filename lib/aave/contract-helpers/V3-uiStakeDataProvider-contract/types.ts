// Migrate from ethers js Bignumbers to native Bigint

export type StakedTokenData =  {
  stakedTokenTotalSupply: bigint;
  stakedTokenTotalRedeemableAmount: bigint;
  stakeCooldownSeconds: bigint;
  stakeUnstakeWindow: bigint;
  rewardTokenPriceUsd: bigint;
  distributionEnd: bigint;
  distributionPerSecond: bigint;
  stakedTokenPriceUsd: bigint;
  stakeApy: bigint;
  inPostSlashingPeriod: boolean;
  maxSlashablePercentage: bigint;
};

export type StakedContractUserData = {
  stakedTokenUserBalance: bigint;
  underlyingTokenUserBalance: bigint;
  stakedTokenRedeemableAmount: bigint;
  userCooldownAmount: bigint;
  userCooldownTimestamp: number;
  rewardsToClaim: bigint;
};

export type StakeUIUserData = {
  stakeTokenUserBalance: string;
  underlyingTokenUserBalance: string;
  stakeTokenRedeemableAmount: string;
  userCooldownAmount: string;
  userCooldownTimestamp: number;
  userIncentivesToClaim: string;
};

export type StakeTokenUIData = {
  inPostSlashingPeriod: boolean;
  stakeTokenTotalSupply: string;
  stakeTokenTotalRedeemableAmount: string;
  stakeCooldownSeconds: number;
  stakeUnstakeWindow: number;
  stakeTokenPriceUSD: string;
  rewardTokenPriceUSD: string;
  stakeApy: string;
  distributionPerSecond: string;
  distributionEnd: string;
  maxSlashablePercentage: string;
};

export type GeneralStakeUIDataHumanized = {
  stakeData: StakeTokenUIData[];
  ethPriceUsd: string;
};

export type GetUserStakeUIDataHumanized = {
  stakeUserData: StakeUIUserData[];
  ethPriceUsd: string;
};
