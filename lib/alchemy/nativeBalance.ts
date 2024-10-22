import type { ResponseError, GetBlanceResponse } from "./types";

export async function getBalance(address: string, chain: string) {
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
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
    redirect: "follow",
  });
  const jsonResponse = await res.json();
  if (res.ok && !jsonResponse.error) {
    // The request was successful
    const alchemyResponseSuccess = jsonResponse as GetBlanceResponse;
    return alchemyResponseSuccess.result;
  } else {
    // The request encountered an error
    const alchemyResponseError = jsonResponse as ResponseError;
    console.error(
      `eth_getBalance failed - HTTP code${res.status}, JSON-RPC code:${alchemyResponseError.error.code}, Message:${alchemyResponseError.error.message}`
    );
    throw new Error(
      `Failed to fetch native balance on ${chain} with ${address}`,
      { cause: alchemyResponseError }
    );
  }
}
