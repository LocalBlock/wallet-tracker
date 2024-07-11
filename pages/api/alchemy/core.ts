import type { NextApiRequest, NextApiResponse } from "next";
import { appSettings } from "@/app/appSettings";
import {
  Alchemy,
  AlchemySettings,
  Network,
  TokenBalancesOptionsErc20,
  TokenBalanceType,
  Utils,
} from "alchemy-sdk";
import {
  createContractData,
  getCoinlist,
  getContractData,
} from "@/app/actions/coinData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const sdkMethod = req.query["sdkMethod"];
    const address = req.query["address"];
    const ens = req.query["ens"];
    const chainId = req.query["chainId"];

    if (typeof sdkMethod === "string") {
      switch (sdkMethod) {
        case "resolveEns":
          {
            if (typeof ens === "string") {
              // Configures the Alchemy SDK
              const config: AlchemySettings = {
                apiKey: process.env.ALCHEMY_APIKEY,
                network: Network.ETH_MAINNET,
              };
              const alchemy = new Alchemy(config);
              const ensAddress = await alchemy.core.resolveName(ens);
              console.log(
                `[Alchemy SDK - ${sdkMethod} - ethereum]`,
                ensAddress
              );
              res.status(200).json(ensAddress);
            } else {
              res.status(400).send(`sdkMethod called : ${sdkMethod}`);
            }
          }
          break;
        case "getNativeBalance":
          {
            const chain = appSettings.chains.find(
              (chain) => chain.id === chainId
            );
            if (typeof address === "string" && chain) {
              // Configures the Alchemy SDK
              const config: AlchemySettings = {
                apiKey: process.env.ALCHEMY_APIKEY,
                network: chain.alchemyMainnet,
              };
              const alchemy = new Alchemy(config);
              const balance = await alchemy.core.getBalance(address, "latest");
              console.log(
                `[Alchemy SDK - ${sdkMethod} - ${chain.id}]`,
                Utils.formatEther(balance)
              );
              res.json(Utils.formatEther(balance));
            } else {
              res.status(400).send(`sdkMethod called : ${sdkMethod}`);
            }
          }
          break;
        case "getAllTokenBalance":
          {
            // Get chain objet form appsettings
            const chain = appSettings.chains.find(
              (chain) => chain.id === chainId
            );
            // Get contractDada
            const contractData = await getContractData();

            if (typeof address === "string" && chain) {
              // Get coinlist from db
              const coinlist = await getCoinlist();

              // Configures the Alchemy SDK
              const config: AlchemySettings = {
                apiKey: process.env.ALCHEMY_APIKEY,
                network: chain.alchemyMainnet,
              };
              const alchemy = new Alchemy(config);
              //Fetch Data, loop if result has pageKey
              let options: TokenBalancesOptionsErc20 = {
                type: TokenBalanceType.ERC20,
                pageKey: undefined,
              };
              const tokens = [];
              let fetchAPI = true;

              while (fetchAPI) {
                const res = await alchemy.core.getTokenBalances(
                  address,
                  options
                );
                tokens.push(...res.tokenBalances);
                if (!res.pageKey) {
                  // Stop loop
                  fetchAPI = false;
                  //console.log("No more token to fetch");
                } else {
                  options = { ...options, pageKey: res.pageKey };
                  //console.log("More token to fetch");
                }
                //Wait before next fetch to prevent THROUGHPUT LIMITS (computing units per second (CUPS) limit in free :330)
                // Desactive because we store metadata to db, and only perform balance
                //await wait(appSettings.fetchDelayRequest);
              }

              // Remove tokens with zero balance
              const nonZeroBalances = tokens.filter(
                (token) =>
                  token.tokenBalance && parseInt(token.tokenBalance, 16) != 0
              );

              // Add decimals and fetch metadadata if not exist in db
              const nonZeroBalancesDecimals = [];
              let counterMetadata = 0;
              for (const token of nonZeroBalances) {
                const findDecimals = contractData.find(
                  (data) =>
                    data.address === token.contractAddress &&
                    data.chainId === chain.id
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

              // Add coinId and build result
              const identifiedTokens = [];
              const unIdentifiedTokens = [];
              for (const alchemyToken of nonZeroBalancesDecimals) {
                const findCoingecko = coinlist.find(
                  (coin) =>
                    coin.platforms[chain.id] === alchemyToken.contractAddress
                );
                if (alchemyToken.decimals) {
                  if (findCoingecko) {
                    identifiedTokens.push({
                      contractAddress: alchemyToken.contractAddress,
                      balance: Utils.formatUnits(
                        BigInt(parseInt(alchemyToken.tokenBalance!, 16)),
                        alchemyToken.decimals
                      ),
                      chain: chain.id,
                      coinDataId: findCoingecko.id,
                    });
                  } else {
                    unIdentifiedTokens.push({
                      contractAddress: alchemyToken.contractAddress,
                      balance: Utils.formatUnits(
                        BigInt(parseInt(alchemyToken.tokenBalance!, 16)),
                        alchemyToken.decimals
                      ),
                      chain: chain.id,
                    });
                  }
                }
              }
              console.log(
                `[Alchemy SDK - ${sdkMethod} - ${chain.id}]`,
                "Total tokens:",
                tokens.length,
                ",Non zero balance:",
                nonZeroBalances.length,
                ",Metadata fetched",
                counterMetadata,
                ",Identified:",
                identifiedTokens.length,
                ",unIdentified:",
                unIdentifiedTokens.length
              );
              res.json({ tokens: identifiedTokens, unIdentifiedTokens });
            } else {
              res.status(400).send(`sdkMethod called : ${sdkMethod}`);
            }
          }
          break;
        default:
          res
            .status(400)
            .send(`Alchemy SDK method:${sdkMethod} not implemented`);
          break;
      }
    } else {
      res.status(400);
    }
    res.status(200)
  }
  res.status(405);
}
