// Original from packages/contract-helpers/src/v3-UiPoolDataProvider-contract/types.ts
// Migrate from ethers js bigints to native Bigint

export interface EModeCategoryHumanized {
  ltv: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  collateralBitmap: string;
  label: string;
  borrowableBitmap: string;
  ltvzeroBitmap: string;
}

export interface EModeCategory {
  ltv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  collateralBitmap: bigint;
  label: string;
  borrowableBitmap: bigint;
  ltvzeroBitmap: bigint;
}

export interface EmodeDataHumanized {
  id: number;
  eMode: EModeCategoryHumanized;
}

export interface EModeData {
  id: number;
  eMode: EModeCategory;
}

export interface ReservesData {
  0: ReadonlyArray<{
    underlyingAsset: string;
    name: string;
    symbol: string;
    decimals: bigint;
    baseLTVasCollateral: bigint;
    reserveLiquidationThreshold: bigint;
    reserveLiquidationBonus: bigint;
    reserveFactor: bigint;
    usageAsCollateralEnabled: boolean;
    borrowingEnabled: boolean;
    isActive: boolean;
    isFrozen: boolean;
    liquidityIndex: bigint;
    variableBorrowIndex: bigint;
    liquidityRate: bigint;
    variableBorrowRate: bigint;
    lastUpdateTimestamp: number;
    aTokenAddress: string;
    variableDebtTokenAddress: string;
    interestRateStrategyAddress: string;
    availableLiquidity: bigint;
    totalScaledVariableDebt: bigint;
    priceInMarketReferenceCurrency: bigint;
    priceOracle: string;
    variableRateSlope1: bigint;
    variableRateSlope2: bigint;
    baseVariableBorrowRate: bigint;
    optimalUsageRatio: bigint;
    isPaused: boolean;
    isSiloedBorrowing: boolean;
    accruedToTreasury: bigint;
    isolationModeTotalDebt: bigint;
    flashLoanEnabled: boolean;
    debtCeiling: bigint;
    debtCeilingDecimals: bigint;
    borrowCap: bigint;
    supplyCap: bigint;
    borrowableInIsolation: boolean;
    virtualUnderlyingBalance: bigint;
    deficit: bigint;
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
    scaledATokenBalance: bigint;
    usageAsCollateralEnabledOnUser: boolean;
    scaledVariableDebt: bigint;
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
  originalId: number;
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
  isActive: boolean;
  isFrozen: boolean;
  liquidityIndex: string;
  variableBorrowIndex: string;
  liquidityRate: string;
  variableBorrowRate: string;
  lastUpdateTimestamp: number;
  aTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
  availableLiquidity: string;
  totalScaledVariableDebt: string;
  priceInMarketReferenceCurrency: string;
  priceOracle: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
  baseVariableBorrowRate: string;
  optimalUsageRatio: string;
  // v3 only
  isPaused: boolean;
  isSiloedBorrowing: boolean;
  accruedToTreasury: string;
  isolationModeTotalDebt: string;
  flashLoanEnabled: boolean;
  debtCeiling: string;
  debtCeilingDecimals: number;
  borrowCap: string;
  supplyCap: string;
  borrowableInIsolation: boolean;
  virtualUnderlyingBalance: string;
  deficit : string;
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
  scaledVariableDebt: string;
}
