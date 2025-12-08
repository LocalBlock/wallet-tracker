import { getCoinlist } from "@/app/actions/coinData";
import { aTokenContractAddresses } from "../aave/poolConfig";
import { appSettings } from "@/app/appSettings";
import { formatEther, formatUnits } from "viem";
import { getTokensByWallet } from "./portfolio";
import { BalanceAPIResult } from "@/app/api/balance/route";
import { GetTokensByWalletRequest } from "./types";
import { stkTokenContractAddresses } from "../aave/stakeConfig";

/**
 * Fetch tokens and native tokens on alchemy
 * @param addresses array of address
 * @returns
 */
export async function fetchTokensBalance(addresses: string[]) {
  // Construct request
  const request: GetTokensByWalletRequest = {
    addresses: addresses.map((address) => {
      return {
        address: address,
        networks: appSettings.chains.map((ch) => ch.alchemyMainnet),
      };
    }),
    includeNativeTokens: true,
    withMetadata: true,
    withPrices: false, // no need prices from alchemy
  };

  // fetch tokens
  const alchemyResult = await getTokensByWallet(request);
  console.log(`${alchemyResult.length} tokens from alchemy`);

  // filter non zero balance to alchemy result
  const nonZeroBalance = alchemyResult.filter(
    (token) => token.tokenBalance && parseInt(token.tokenBalance, 16) != 0
  );
  console.log(`${nonZeroBalance.length} non zero balance`);

  // Get coinlist from db
  const coinlist = await getCoinlist();

  // Build result
  const result: BalanceAPIResult = addresses.map((address) => {
    return { address, nativeTokens: [], tokens: [] };
  });

  nonZeroBalance.forEach((rawToken) => {
    const resultAddress = result.find(
      (result) => result.address.toLowerCase() === rawToken.address
    );
    if (!resultAddress) throw new Error(rawToken.address + " not finded");
    // adaptation pour matic/polygon à verifier pus tard si ca marche toujours
    const rawNetwork =
      rawToken.network === "matic-mainnet"
        ? "polygon-mainnet"
        : rawToken.network;
    const chain = appSettings.chains.find(
      (ch) => ch.alchemyMainnet === rawNetwork
    );
    if (!chain) throw new Error(rawNetwork + "not in appSettings ");

    if (rawToken.tokenAddress === null) {
      // no token address mean native token
      resultAddress.nativeTokens.push({
        balance: formatEther(BigInt(rawToken.tokenBalance)),
        coinDataId: chain.tokenId,
        chain: chain.id,
      });
    } else {
      // standard token
      if (
        rawToken.tokenMetadata && // with metadata
        rawToken.tokenMetadata.decimals && // and decimals
        !aTokenContractAddresses.includes(rawToken.tokenAddress) && // and not a aave token
        !stkTokenContractAddresses.includes(rawToken.tokenAddress) // and not stake token
      ) {
        const findCoingecko = coinlist.find(
          (coin) => coin.platforms[chain.id] === rawToken.tokenAddress
        );
        resultAddress.tokens.push({
          balance: formatUnits(
            BigInt(parseInt(rawToken.tokenBalance, 16)),
            rawToken.tokenMetadata.decimals
          ),
          contractAddress: rawToken.tokenAddress,
          chain: chain.id,
          coinDataId: findCoingecko ? findCoingecko.id : undefined,
        });
      }
    } // otherwise ignore token data
  });

  return result;
}
