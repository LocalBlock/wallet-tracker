import { AaveSafetyModule, AaveV3Ethereum } from "@bgd-labs/aave-address-book";
import { ChainId, Stake } from "./contract-helpers";

export interface StakeConfig {
  chainId: ChainId;
  stakeDataProvider: string;
  tokens: {
    [token: string]: {
      TOKEN_STAKING: string;
      STAKING_REWARD_TOKEN: string;
      TOKEN_ORACLE: string;
    };
  };
}

/** Stake configuration for Safety module (Only on Ethereum Mainnet)
 * @see https://github.com/aave/interface/blob/main/src/ui-config/stakeConfig.ts from Aave UI
 */
export const stakeConfig: StakeConfig = {
  chainId: ChainId.mainnet,
  stakeDataProvider: "0xb12e82DF057BF16ecFa89D7D089dc7E5C1Dc057B",
  tokens: {
    [Stake.aave]: {
      TOKEN_STAKING: AaveSafetyModule.STK_AAVE,
      STAKING_REWARD_TOKEN: AaveV3Ethereum.ASSETS.AAVE.UNDERLYING,
      TOKEN_ORACLE: AaveV3Ethereum.ASSETS.AAVE.ORACLE,
    },
    [Stake.bpt]: {
      TOKEN_STAKING: AaveSafetyModule.STK_ABPT,
      STAKING_REWARD_TOKEN: AaveV3Ethereum.ASSETS.AAVE.UNDERLYING,
      TOKEN_ORACLE: AaveSafetyModule.STK_ABPT_ORACLE,
    },
    [Stake.gho]: {
      TOKEN_STAKING: AaveSafetyModule.STK_GHO,
      STAKING_REWARD_TOKEN: AaveV3Ethereum.ASSETS.AAVE.UNDERLYING,
      TOKEN_ORACLE: "0x3f12643d3f6f874d39c2a4c9f2cd6f2dbac877fc", // CL Feed
    },
    [Stake.bptv2]: {
      TOKEN_STAKING: AaveSafetyModule.STK_AAVE_WSTETH_BPTV2,
      STAKING_REWARD_TOKEN: AaveV3Ethereum.ASSETS.AAVE.UNDERLYING,
      TOKEN_ORACLE: AaveSafetyModule.STK_AAVE_WSTETH_BPTV2_ORACLE,
    },
  },
};

export const stakeAssetNameFormatted = (stakeAssetName: Stake) => {
  switch (stakeAssetName) {
    case Stake.aave:
      return "AAVE";
    case Stake.bpt:
      return "ABPT";
    case Stake.gho:
      return "GHO";
    case Stake.bptv2:
      return "ABPT V2";
  }
};

/**
 * Stake Tokens from AaveSafetyModule
 */
export const stkTokenContractAddresses = [
  AaveSafetyModule.STK_AAVE.toLowerCase(),
  AaveSafetyModule.STK_ABPT.toLowerCase(),
  AaveSafetyModule.STK_GHO.toLowerCase(),
  AaveSafetyModule.STK_AAVE_WSTETH_BPTV2.toLowerCase(),
];
