// Custom version of @aave/contract-helpers which use Wagmi/view instead of ethers@5
// NOTE : This is a minimal implentation, solely for the purpose of this application
// 1. Fetch data from Aave safety module
// 2. Fetch data from Aave pools

export * from './V3-uiStakeDataProvider-contract';
export * from './v3-UiPoolDataProvider-contract';
export * from './v3-UiPoolDataProvider-legacy-contract';

// commons
export * from './commons/types';

// Shared method input types
export type ReservesHelperInput = {
  lendingPoolAddressProvider: string;
};

export type UserReservesHelperInput = {
  user: string;
  lendingPoolAddressProvider: string;
};
