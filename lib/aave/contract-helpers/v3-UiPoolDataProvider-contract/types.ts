// Original from packages/contract-helpers/src/v3-UiPoolDataProvider-contract/types.ts
// Migrate from ethers js Bignumbers to native Bigint

export interface ReservesData {
  0: ReadonlyArray< {
    underlyingAsset: string;
    name: string;
    symbol: string;
    decimals: BigInt;
    baseLTVasCollateral: BigInt;
    reserveLiquidationThreshold: BigInt;
    reserveLiquidationBonus: BigInt;
    reserveFactor: BigInt;
    usageAsCollateralEnabled: boolean;
    borrowingEnabled: boolean;
    stableBorrowRateEnabled: boolean;
    isActive: boolean;
    isFrozen: boolean;
    liquidityIndex: BigInt;
    variableBorrowIndex: BigInt;
    liquidityRate: BigInt;
    variableBorrowRate: BigInt;
    stableBorrowRate: BigInt;
    lastUpdateTimestamp: number;
    aTokenAddress: string;
    stableDebtTokenAddress: string;
    variableDebtTokenAddress: string;
    interestRateStrategyAddress: string;
    availableLiquidity: bigint;
    totalPrincipalStableDebt: bigint;
    averageStableRate: bigint;
    stableDebtLastUpdateTimestamp: bigint;
    totalScaledVariableDebt: bigint;
    priceInMarketReferenceCurrency: bigint;
    priceOracle: string;
    variableRateSlope1: bigint;
    variableRateSlope2: bigint;
    stableRateSlope1: bigint;
    stableRateSlope2: bigint;
    baseStableBorrowRate: bigint;
    baseVariableBorrowRate: bigint;
    optimalUsageRatio: bigint;
    isPaused: boolean;
    isSiloedBorrowing: boolean;
    accruedToTreasury: bigint;
    unbacked: bigint;
    isolationModeTotalDebt: bigint;
    debtCeiling: bigint;
    debtCeilingDecimals: bigint;
    eModeCategoryId: number;
    borrowCap: bigint;
    supplyCap: bigint;
    eModeLtv: number;
    eModeLiquidationThreshold: number;
    eModeLiquidationBonus: number;
    eModePriceSource: string;
    eModeLabel: string;
    borrowableInIsolation: boolean;
    flashLoanEnabled: boolean;
    virtualAccActive: boolean;
    virtualUnderlyingBalance: bigint;
  }>;
  1: {
    marketReferenceCurrencyUnit: bigint;
    marketReferenceCurrencyPriceInUsd: bigint;
    networkBaseTokenPriceInUsd: bigint;
    networkBaseTokenPriceDecimals: number;
  };
}

export interface UserReserveData {
  0: ReadonlyArray<{
    underlyingAsset: string;
    scaledATokenBalance: BigInt;
    usageAsCollateralEnabledOnUser: boolean;
    stableBorrowRate: bigint;
    scaledVariableDebt: bigint;
    principalStableDebt: bigint;
    stableBorrowLastUpdateTimestamp: bigint;
  }>;
  1: number;
}

export interface PoolBaseCurrencyHumanized {
  marketReferenceCurrencyDecimals: number;
  marketReferenceCurrencyPriceInUsd: string;
  networkBaseTokenPriceInUsd: string;
  networkBaseTokenPriceDecimals: number;
}
export interface ReserveDataHumanized {
  id: string;
  underlyingAsset: string;
  name: string;
  symbol: string;
  decimals: number;
  baseLTVasCollateral: string;
  reserveLiquidationThreshold: string;
  reserveLiquidationBonus: string;
  reserveFactor: string;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  liquidityIndex: string;
  variableBorrowIndex: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  lastUpdateTimestamp: number;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
  availableLiquidity: string;
  totalPrincipalStableDebt: string;
  averageStableRate: string;
  stableDebtLastUpdateTimestamp: number;
  totalScaledVariableDebt: string;
  priceInMarketReferenceCurrency: string;
  priceOracle: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
  stableRateSlope1: string;
  stableRateSlope2: string;
  baseStableBorrowRate: string;
  baseVariableBorrowRate: string;
  optimalUsageRatio: string;
  // v3 only
  isPaused: boolean;
  isSiloedBorrowing: boolean;
  accruedToTreasury: string;
  unbacked: string;
  isolationModeTotalDebt: string;
  debtCeiling: string;
  debtCeilingDecimals: number;
  eModeCategoryId: number;
  borrowCap: string;
  supplyCap: string;
  eModeLtv: number;
  eModeLiquidationThreshold: number;
  eModeLiquidationBonus: number;
  eModePriceSource: string;
  eModeLabel: string;
  borrowableInIsolation: boolean;
  flashLoanEnabled: boolean;
  virtualAccActive: boolean;
  virtualUnderlyingBalance: string;
}

export interface ReservesDataHumanized {
  reservesData: ReserveDataHumanized[];
  baseCurrencyData: PoolBaseCurrencyHumanized;
}

export interface UserReserveDataHumanized {
  id: string;
  underlyingAsset: string;
  scaledATokenBalance: string;
  usageAsCollateralEnabledOnUser: boolean;
  stableBorrowRate: string;
  scaledVariableDebt: string;
  principalStableDebt: string;
  stableBorrowLastUpdateTimestamp: number;
}