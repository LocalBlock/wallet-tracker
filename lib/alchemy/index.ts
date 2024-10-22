import {
  createContractData,
  getCoinlist,
  getContractData,
} from "@/app/actions/coinData";
import { aTokenContractAddresses } from "../aave/poolConfig";
import { appSettings } from "@/app/appSettings";

import { getTokenBalances, getTokenMetadata } from "./tokens";
import { formatEther, formatUnits } from "viem";
import { getBalance } from "./nativeBalance";

export async function fetchTokensBalance(
  address: string,
  chain: (typeof appSettings.chains)[number]
) {
  // Get contractData
  const contractData = await getContractData();

  // Get coinlist from db
  const coinlist = await getCoinlist();

  // Get tokens
  console.log(`\x1b[36m[Fetch]\x1b[0m Token balances`);
  const tokens = await getTokenBalances(address, chain.alchemyMainnet);

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
      const metadata = await getTokenMetadata(
        token.contractAddress,
        chain.alchemyMainnet
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
        balance: formatUnits(
          BigInt(parseInt(alchemyToken.tokenBalance!, 16)),
          alchemyToken.decimals
        ),
        chain: chain.id,
        coinDataId: findCoingecko ? findCoingecko.id : undefined,
      });
    }
  }

  console.log(
    `\x1b[32m[Fetch result]\x1b[0m`,
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

export async function fetchNativeBalance(
  address: string,
  chain: (typeof appSettings.chains)[number]
) {
  console.log(`\x1b[36m[Fetch]\x1b[0m Native balance`);
  const balance = await getBalance(address, chain.alchemyMainnet);
  console.log(`\x1b[32m[Fetch Result]\x1b[0m ${formatEther(BigInt(balance))}`);
  return {
    balance: formatEther(BigInt(balance)),
    coinDataId: chain.tokenId,
    chain: chain.id,
  };
}
