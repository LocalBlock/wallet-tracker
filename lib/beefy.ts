import { getCoinlist } from "@/app/actions/coinData";
import { BeefyApy, BeefyBalance, BeefyLps, BeefyVault } from "@/types";
import { AddressWallet } from "@prisma/client";

export async function fetchBeefyVaults(
  tokens: AddressWallet["tokens"],
  unIdentifiedTokens: Omit<AddressWallet["tokens"][number], "coinDataId">[]
) {
  const coinlist = await getCoinlist();
  // Fetch Data
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

  identify(tokens);
  identify(unIdentifiedTokens);
  console.log(
    "[Fetch] Beefy : ",
    beefyUserVaults.map((bf) => bf.id)
  );
  return beefyUserVaults;

  function identify(
    tokens:
      | AddressWallet["tokens"]
      | Omit<AddressWallet["tokens"][number], "coinDataId">[]
  ) {
    const filteredTokens = [];
    for (const token of tokens) {
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
        // All tokens without beefy vault
        filteredTokens.push(token);
      }
    }
    tokens = filteredTokens;
  }
}

export function mergeBeefyVaults(selectedBeefyVaults: BeefyBalance[]) {
  //const result:BeefyBalance[]=[]
  return selectedBeefyVaults.reduce((acc, currentValue) => {
    const index = acc.findIndex((v) => v.id === currentValue.id);
    if (index != -1) {
      //merge
      acc[index].currentBalance = (
        Number(acc[index].currentBalance) + Number(currentValue.currentBalance)
      ).toString();
      acc[index].currentBalanceHarvest = (
        Number(acc[index].currentBalanceHarvest) +
        Number(currentValue.currentBalanceHarvest)
      ).toString();
    } else {
      acc.push(currentValue);
    }
    //if(acc.)

    return [...acc];
  }, [] as BeefyBalance[]);
}
