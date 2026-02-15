import {
  AaveV3Ethereum,
  AaveV3Polygon,
} from "@bgd-labs/aave-address-book"; // import specific pool

export const poolConfig = {
  aaveV3: {
    ethereum: {
      uiPoolDataProviderAddress: AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
      uiIncentiveDataProviderAddress: AaveV3Ethereum.UI_INCENTIVE_DATA_PROVIDER,
      lendingPoolAddressProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    },
    "polygon-pos": {
      uiPoolDataProviderAddress: AaveV3Polygon.UI_POOL_DATA_PROVIDER,
      uiIncentiveDataProviderAddress: AaveV3Polygon.UI_INCENTIVE_DATA_PROVIDER,
      lendingPoolAddressProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    },
  },
};


/**
 * All aToken contract addresses.
 * @returns {string[]} An array of aToken contract addresses to lowercase.
 */
export const aTokenContractAddresses = getAaveAssets().map((asset) =>
  asset.A_TOKEN.toLowerCase()
);

function getAaveAssets() {
  return [
    ...Object.values(AaveV3Ethereum.ASSETS),
    ...Object.values(AaveV3Polygon.ASSETS),
  ];
}
