// Alchemy portfolio API
import {
  AlchemyError,
  GetTokensByWalletRequest,
  GetTokensByWalletResponse,
} from "./types";

export async function getTokensByWallet(request: GetTokensByWalletRequest) {
  const url = `https://api.g.alchemy.com/data/v1/${process.env.ALCHEMY_APIKEY}/assets/tokens/by-address`;

  const tokens = [];
  let hasNext = true;
  let pageKey = undefined;

  while (hasNext) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pageKey ? { ...request, pageKey } : request),
    });
    const jsonResponse = await res.json();

    if (res.ok && !jsonResponse.error) {
      // The request was successful
      const alchemyResponseSuccess = jsonResponse as GetTokensByWalletResponse;

      if (alchemyResponseSuccess.data.pageKey != null) {
        // need to continue
        pageKey = alchemyResponseSuccess.data.pageKey;
        hasNext = true;
      } else {
        //Stop fetching
        hasNext = false;
      }
      // push tokens
      tokens.push(...alchemyResponseSuccess.data.tokens);
    } else {
      // The request encountered an error
      const alchemyResponseError = jsonResponse as AlchemyError;
      console.error(
        `Get tokens by wallet failed - HTTP code${res.status}, Message:${alchemyResponseError.error.message}`
      );

      throw new Error(
        `Failed to fetch tokens by wallet with ${request.addresses
          .map((ad) => ad.address)
          .join(", ")}`,
        { cause: alchemyResponseError }
      );
    }
  }
  return tokens;
}
