import type {
  ResponseError,
  TokenBalancesResponse,
  TokenMetadataResponse,
} from "./types";

export async function getTokenBalances(address: string, chain: string) {
  const url = `https://${chain}.g.alchemy.com/v2/${process.env.ALCHEMY_APIKEY}`;

  const tokens = [];
  let fetchAPI = true;

  let pageKey = undefined;
  while (fetchAPI) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 42,
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        params: [address, "erc20", { pageKey }],
      }),
      redirect: "follow",
    });

    const jsonResponse = await res.json();

    if (res.ok && !jsonResponse.error) {
      // The request was successful
      const alchemyResponseSuccess = jsonResponse as TokenBalancesResponse;
      tokens.push(...alchemyResponseSuccess.result.tokenBalances);
      if (!alchemyResponseSuccess.result.pageKey) {
        // Stop loop
        fetchAPI = false;
        //console.log("No more token to fetch");
      } else {
        pageKey = alchemyResponseSuccess.result.pageKey;
        //console.log("More token to fetch");
      }
    } else {
      // The request encountered an error
      const alchemyResponseError = jsonResponse as ResponseError;
      fetchAPI = false; // Stop loop
      console.error(
        `alchemy_getTokenBalances failed - HTTP code${res.status}, JSON-RPC code:${alchemyResponseError.error.code}, Message:${alchemyResponseError.error.message}`
      );
      throw new Error(
        `Failed to fetch token balances on ${chain} with ${address}`,
        { cause: alchemyResponseError }
      );
    }
  }
  return tokens;
}

export async function getTokenMetadata(contractAddress: string, chain: string) {
  const url = `https://${chain}.g.alchemy.com/v2/${process.env.ALCHEMY_APIKEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 42,
      jsonrpc: "2.0",
      method: "alchemy_getTokenMetadata",
      params: [contractAddress],
    }),
    redirect: "follow",
  });
  const jsonResponse = await res.json();
  if (res.ok && !jsonResponse.error) {
    // The request was successful
    const alchemyResponseSuccess = jsonResponse as TokenMetadataResponse;
    return alchemyResponseSuccess.result;
  } else {
    //  the request encountered an error
    const alchemyResponseError = jsonResponse as ResponseError;
    console.error(
      `alchemy_getTokenMetadata failed - HTTP code${res.status}, JSON-RPC code:${alchemyResponseError.error.code}, Message:${alchemyResponseError.error.message}`
    );
    throw new Error(
      `Failed to fetch token metadata on ${chain} with ${contractAddress}`,
      { cause: alchemyResponseError }
    );
  }
}
