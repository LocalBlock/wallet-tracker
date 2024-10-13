import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { type BeefyApy, BeefyBalance, BeefyLps, BeefyVault } from "@/types";
import { getCoinlist } from "@/app/actions/coinData";
import { fetchTokensBalance } from "@/lib/alchemy";

export type BeefyAPIResult = {
  beefyUserVaults: BeefyBalance[];
};
export type BeefyAPIError = {
  message: string;
};

export async function POST(request: NextRequest) {
  const allTokens = (await request.json()) as Awaited<
    ReturnType<typeof fetchTokensBalance>
  >;
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json<Error>(
      {
        name: "Unauthorized",
        message: "User not logged in",
      },
      {
        status: 401,
      }
    );
  }
  try {
    const coinlist = await getCoinlist();
    const vaultData = (await (
      await fetch(`https://api.beefy.finance/vaults`)
    ).json()) as BeefyVault[];
    const apyData = (await (
      await fetch(`https://api.beefy.finance/apy`)
    ).json()) as BeefyApy;
    const lpsData = (await (
      await fetch(`https://api.beefy.finance/lps/breakdown`)
    ).json()) as BeefyLps;

    const beefyUserVaults: BeefyBalance[] = [];

    //const filteredTokens = [];
    for (const token of allTokens) {
      const findBeefyVault = vaultData.find(
        (vault) =>
          vault.earnContractAddress.toLocaleLowerCase() ===
          token.contractAddress
      );

      if (findBeefyVault) {
        //console.log(findBeefyVault)
        let ignore = false;
        let ignoreReason = "undefined";
        let price = 0;
        const pricePerFullShareWithDecimal = Number(
          [
            findBeefyVault.pricePerFullShare.slice(0, -18),
            ".",
            findBeefyVault.pricePerFullShare.slice(-18),
          ].join("")
        );

        const beefyTokens = [] as BeefyBalance["tokens"];

        if (findBeefyVault.oracle === "tokens" && findBeefyVault.tokenAddress) {
          const contract = findBeefyVault.tokenAddress!.toLowerCase();
          // Wihtout lps, we have directly contract token
          const findCoingecko = coinlist.find(
            (coin) => coin.platforms[token.chain] === contract
          );
          if (findCoingecko) {
            beefyTokens.push({
              id: findCoingecko.id,
              contract,
            });
          } else {
            ignore = true;
            ignoreReason = "Oracle Token and No findCoingecko";
          }
        } else {
          // With lps, we need to retreive data from lps also
          if (lpsData[findBeefyVault.id]) {
            if (lpsData[findBeefyVault.id].tokens) {
              lpsData[findBeefyVault.id].tokens.forEach(
                (beefyTokenContract) => {
                  const findCoingecko = coinlist.find(
                    (coin) =>
                      coin.platforms[token.chain] ===
                      beefyTokenContract.toLocaleLowerCase()
                  );
                  if (findCoingecko) {
                    beefyTokens.push({
                      id: findCoingecko.id,
                      contract: beefyTokenContract.toLocaleLowerCase(),
                    });
                  } else {
                    ignore = true;
                    ignoreReason = "Oracle lps and No findCoingecko";
                  }
                }
              );
              price = lpsData[findBeefyVault.id].price;
            } else {
              //Stargate case : with lps but without tokens in lps
              // not working....
              if (findBeefyVault.tokenAddress) {
                const contract =
                  findBeefyVault.tokenAddress.toLocaleLowerCase();

                const findCoingecko = coinlist.find(
                  (coin) => coin.platforms[token.chain] === contract
                );
                if (findCoingecko) {
                  beefyTokens.push({
                    id: findCoingecko.id,
                    contract,
                  });
                } else {
                  ignore = true;
                  ignoreReason = "No token in lps and No find coingecko";
                }
              }
            }
          } else {
            // No lps find
            ignore = true;
            ignoreReason = "No lps";
          }
        }

        if (!ignore) {
          beefyUserVaults.push({
            earnContractAddress: findBeefyVault.earnContractAddress,
            id: findBeefyVault.id,
            name: findBeefyVault.name,
            chain: token.chain,
            tokens: beefyTokens,
            lpsPrice: price,
            apy: apyData[findBeefyVault.id],
            pricePerFullShare: findBeefyVault.pricePerFullShare,
            currentBalance: token.balance,
            currentBalanceHarvest: (
              pricePerFullShareWithDecimal * Number(token.balance)
            ).toString(),
          });
        } else {
          console.log("[Ignore]", findBeefyVault.id, ignoreReason);
        }
      } else {
        // Nothing
      }
    }

    return NextResponse.json<BeefyAPIResult>({
      beefyUserVaults,
    });
  } catch (error: any) {
    return NextResponse.json<BeefyAPIError>(
      {
        message: error.message,
      },
      { status: error.status }
    );
  }
}
