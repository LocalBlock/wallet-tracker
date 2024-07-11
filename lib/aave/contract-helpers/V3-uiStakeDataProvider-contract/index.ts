import { Address, isAddress } from "viem";
import { config } from "@/lib/aave/wagmiConfig";
import { readContract } from "@wagmi/core";
import { abi } from "./abi"; // ABI for StakedTokenDataProvider contract (Seems not in @bgd-labs/aave-address-book)

import {
  StakedTokenData,
  GeneralStakeUIDataHumanized,
  StakedContractUserData,
  GetUserStakeUIDataHumanized,
  StakeTokenUIData,
  StakeUIUserData,
} from "./types";


export interface UiStakeDataProviderInterfaceV3 {
  getStakedAssetDataBatch: (
    stakedAssets: string[],
    oracles: string[]
  ) => Promise<GeneralStakeUIDataHumanized>;
  getUserStakeUIDataHumanized: (params: {
    user: string;
    stakedAssets: string[];
    oracles: string[];
  }) => Promise<GetUserStakeUIDataHumanized>;
}

export type UiStakeDataProviderContext = {
  uiStakeDataProvider: string;
};

export class UiStakeDataProviderV3 implements UiStakeDataProviderInterfaceV3 {

  private readonly uiStakeDataProvider: Address;

  public constructor(context: UiStakeDataProviderContext) {
    if (!isAddress(context.uiStakeDataProvider)) {
      throw new Error("contract address is not valid");
    }
    this.uiStakeDataProvider = context.uiStakeDataProvider;
  }

  public async getUserStakeUIDataHumanized({
    user,
    stakedAssets,
    oracles,
  }: {
    user: string;
    stakedAssets: string[];
    oracles: string[];
  }): Promise<GetUserStakeUIDataHumanized> {
    const [, stakedUserData] = await readContract(config, {
      abi,
      address: this.uiStakeDataProvider,
      functionName: "getStakedUserDataBatch",
      args: [stakedAssets as Address[], oracles as Address[], user as Address],
    });

    // // NOTE only fetching eth price here, should we call oracle directly?
    const [, ethPrice] = await readContract(config, {
      abi,
      address: this.uiStakeDataProvider,
      functionName: "getStakedAssetDataBatch",
      args: [stakedAssets as Address[], oracles as Address[]],
    });

    const parsedUserStakedData = handleUserStakedData(stakedUserData);

    return {
      stakeUserData: parsedUserStakedData,
      ethPriceUsd: ethPrice.toString(),
    };
  }

  public async getStakedAssetDataBatch(
    stakedAssets: string[],
    oracles: string[]
  ): Promise<GeneralStakeUIDataHumanized> {
    const [stakedData, ethPrice] = await readContract(config, {
      abi,
      address: this.uiStakeDataProvider,
      functionName: "getStakedAssetDataBatch",
      args: [stakedAssets as Address[], oracles as Address[]],
    });

    const parsedStakedData = handleParsedStakedData(stakedData);
    return { stakeData: parsedStakedData, ethPriceUsd: ethPrice.toString() };
  }
}

function handleUserStakedData(
  stakeUserData: readonly StakedContractUserData[]
) {
  return stakeUserData.map<StakeUIUserData>((data: StakedContractUserData) => {
    return {
      stakeTokenUserBalance: data.stakedTokenUserBalance.toString(),
      underlyingTokenUserBalance: data.underlyingTokenUserBalance.toString(),
      stakeTokenRedeemableAmount: data.stakedTokenRedeemableAmount.toString(),
      userCooldownAmount: data.userCooldownAmount.toString(),
      userCooldownTimestamp: data.userCooldownTimestamp,
      userIncentivesToClaim: data.rewardsToClaim.toString(),
    };
  });
}

function handleParsedStakedData(stakedData: readonly StakedTokenData[]) {
  return stakedData.map<StakeTokenUIData>((data: StakedTokenData) => {
    return {
      inPostSlashingPeriod: data.inPostSlashingPeriod || false,
      stakeTokenTotalSupply: data.stakedTokenTotalSupply.toString(),
      stakeTokenTotalRedeemableAmount:
        data.stakedTokenTotalRedeemableAmount.toString(),
      stakeCooldownSeconds: Number(data.stakeCooldownSeconds),
      stakeUnstakeWindow: Number(data.stakeUnstakeWindow),
      stakeTokenPriceUSD: data.stakedTokenPriceUsd.toString(),
      rewardTokenPriceUSD: data.rewardTokenPriceUsd.toString(),
      stakeApy: data.stakeApy.toString(),
      distributionPerSecond: data.distributionPerSecond.toString(),
      distributionEnd: data.distributionEnd.toString(),
      maxSlashablePercentage: data.maxSlashablePercentage.toString(),
    };
  });
}
