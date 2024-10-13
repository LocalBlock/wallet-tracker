"use server";
import {
  createContractData,
  getCoinlist,
  getContractData,
} from "@/app/actions/coinData";
import { appSettings } from "@/app/appSettings";
import {
  Alchemy,
  AlchemySettings,
  Network,
  TokenBalancesOptionsErc20,
  TokenBalanceType,
  Utils,
} from "alchemy-sdk";
import { aTokenContractAddresses } from "./aave/poolConfig";

// NOTE : for all achemy sdk call when need to setup a option in alchemy setting => connectionInfoOverrides: { skipFetchSetup: true }
// because of an issue (missing response) with ethers@5 (used by alchemy-sdk) and next 14 @see https://github.com/alchemyplatform/alchemy-sdk-js/issues/400#issuecomment-2151351091

export async function fetchEnsAddress(ens: string) {
  const config: AlchemySettings = {
    apiKey: process.env.ALCHEMY_APIKEY,
    network: Network.ETH_MAINNET,
    connectionInfoOverrides: { skipFetchSetup: true },
  };
  const alchemy = new Alchemy(config);

  const ensAddress = await alchemy.core.resolveName(ens);
  console.log(`[Resolve ENS on Ethereum]`, ensAddress);
  return ensAddress;
}

export async function fetchNativeBalance(
  address: string,
  chain: (typeof appSettings.chains)[number]
) {
  const config: AlchemySettings = {
    apiKey: process.env.ALCHEMY_APIKEY,
    network: chain.alchemyMainnet,
    connectionInfoOverrides: { skipFetchSetup: true },
  };
  const alchemy = new Alchemy(config);

  console.log(`[Fetch] Native balance on ${chain.id}`);
  const balance = await alchemy.core.getBalance(address, "latest");
  return {
    balance: Utils.formatEther(balance),
    coinDataId: chain.tokenId,
    chain: chain.id,
  };
}

export async function fetchTokensBalance(
  address: string,
  chain: (typeof appSettings.chains)[number]
) {
  const config: AlchemySettings = {
    apiKey: process.env.ALCHEMY_APIKEY,
    network: chain.alchemyMainnet,
    connectionInfoOverrides: { skipFetchSetup: true },
  };
  const alchemy = new Alchemy(config);

  // Get contractData
  const contractData = await getContractData();

  // Get coinlist from db
  const coinlist = await getCoinlist();

  //Fetch Data, loop if result has pageKey
  let options: TokenBalancesOptionsErc20 = {
    type: TokenBalanceType.ERC20,
    pageKey: undefined,
  };
  const tokens = [];
  let fetchAPI = true;

  console.log(`[Fetch] Token balances on ${chain.id}`);
  while (fetchAPI) {
    const res = await alchemy.core.getTokenBalances(address, options);
    tokens.push(...res.tokenBalances);
    if (!res.pageKey) {
      // Stop loop
      fetchAPI = false;
      //console.log("No more token to fetch");
    } else {
      options = { ...options, pageKey: res.pageKey };
      //console.log("More token to fetch");
    }
  }

  // Remove tokens with zero balance and Atoken (atokenContractAddresses from aave-address-book )
  const nonZeroBalances = tokens
    .filter(
      (token) => token.tokenBalance && parseInt(token.tokenBalance, 16) != 0
    )
    .filter(
      (token) => !aTokenContractAddresses.includes(token.contractAddress)
    );

  // Add decimals and fetch metadadata if not exist in db
  const nonZeroBalancesDecimals = [];
  let counterMetadata = 0;
  for (const token of nonZeroBalances) {
    const findDecimals = contractData.find(
      (data) =>
        data.address === token.contractAddress && data.chainId === chain.id
    );
    if (!findDecimals) {
      const metadata = await alchemy.core.getTokenMetadata(
        token.contractAddress
      );
      counterMetadata++;

      nonZeroBalancesDecimals.push({
        ...token,
        decimals: metadata.decimals,
      });
      await createContractData({
        chainId: chain.id,
        address: token.contractAddress,
        decimals: metadata.decimals,
        name: metadata.name,
        symbol: metadata.symbol,
      });
    } else {
      nonZeroBalancesDecimals.push({
        ...token,
        decimals: findDecimals.decimals,
      });
    }
  }

  const resultTokens = [];
  for (const alchemyToken of nonZeroBalancesDecimals) {
    const findCoingecko = coinlist.find(
      (coin) => coin.platforms[chain.id] === alchemyToken.contractAddress
    );
    if (alchemyToken.decimals) {
      resultTokens.push({
        contractAddress: alchemyToken.contractAddress,
        balance: Utils.formatUnits(
          BigInt(parseInt(alchemyToken.tokenBalance!, 16)),
          alchemyToken.decimals
        ),
        chain: chain.id,
        coinDataId: findCoingecko ? findCoingecko.id : undefined,
      });
    }
  }

  console.log(
    `[Fetch] Tokens balance on ${chain.id}]`,
    "Total tokens:",
    tokens.length,
    ",Non zero balance:",
    nonZeroBalances.length,
    ",Metadata fetched",
    counterMetadata,
    ",Tokens result:",
    resultTokens.length
  );
  return resultTokens;
}
