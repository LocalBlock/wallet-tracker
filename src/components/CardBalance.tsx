import {
  Card,
  CardBody,
  CardHeader,
  Image,
  VStack,
  Box,
  StackDivider,
  SimpleGrid,
  Heading,
  Tag,
} from "@chakra-ui/react";
import React from "react";

import {
  formatBalanceCurrency,
  formatBalanceToken,
  formatBalanceChange,
  mergeTokensWallet,
  mergeTokensChain,
  mergeCoinsWallet,
  mergeTokensAndCoins,
} from "../functions/utils";

import { prices } from "../types/types";

import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";
import { Token } from "../classes/Token";
import { appSettings } from "../settings/appSettings";

interface Props {
  allActiveWallet: (AddressWallet|CustomWallet|Web3Wallet)[];
  selectedChain: string[];
  selectedCurrency: string;
}

export default function CardBalance({
  allActiveWallet,
  selectedChain,
  selectedCurrency,
}: Props) {


  const allActiveWalletFiltered = allActiveWallet.filter(
    (wallet) => wallet.type === ("AddressWallet" || "Web3Wallet")
  ) as (AddressWallet | Web3Wallet)[];
  const allActiveCustomWallet = allActiveWallet.filter(
    (wallet) => wallet.type === "CustomWallet"
  ) as CustomWallet[];

  //Merge tokens from all active addresses
  let allActiveTokens = mergeTokensWallet(allActiveWalletFiltered);


  //Filter by chain
  allActiveTokens = allActiveTokens.filter((token) =>
    selectedChain.some((element) => element === token.chain)
  );

  // Merge same token on all selected chain
  allActiveTokens = mergeTokensChain(allActiveTokens);


  
  // All coin merge from CustomWallet
  const allActiveCoins = mergeCoinsWallet(allActiveCustomWallet);


  const allActiveTokensCoins = mergeTokensAndCoins(allActiveTokens,allActiveCoins);
// Sort Token and coins Descent
  allActiveTokensCoins.sort(
    (a, b) =>
      (b.current_price ?? 0) * Number(b.balance) -
      (a.current_price ?? 0) * Number(a.balance)
  );

  const currency24hChangePropName = (selectedCurrency +
    "_24h_change") as keyof prices;

  //Calculate totalBalance
  let totalBalance = 0;
  allActiveTokensCoins.forEach((token) => {
    totalBalance += token.getBalanceCurrency(selectedCurrency);
  });
  //console.log('render card balance');
  return (
    <Card>
      <CardHeader>
        <Heading size="md">
          Wallet :{" "}
          <span>{formatBalanceCurrency(totalBalance, selectedCurrency)}</span>
        </Heading>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {allActiveTokensCoins.map((token, index) => (
            <SimpleGrid
              key={index}
              columns={3}
              templateColumns={"50px 1fr auto"}
              spacingX={5}
            >
              <Box alignSelf={"center"}>
                <Image loading="lazy" src={token.image} alt={token.name} />
              </Box>
              <Box>
                <Box>
                  <b>{token.name} </b>
                  {token instanceof Token &&
                  <Tag
                    variant={token.chain.includes(",") ? "subtle" : token.chain}
                  >
                    {appSettings.chains.find(
                      (chain) => chain.id === token.chain
                    )?.name ?? "MultiChains"}
                  </Tag>}
                </Box>
                <Box>
                  {formatBalanceToken(
                    Number(token.balance),
                    token.symbol?.toUpperCase() ?? ""
                  )}
                </Box>
              </Box>
              <Box textAlign={"right"}>
                <Box>
                  {formatBalanceCurrency(
                    token.getBalanceCurrency(selectedCurrency),
                    selectedCurrency
                  )}
                </Box>

                <Box
                  color={
                    token.prices[currency24hChangePropName] >= 0
                      ? "green"
                      : "red"
                  }
                >
                  {formatBalanceChange(
                    token.prices[currency24hChangePropName] ?? 0,
                    token.getBalanceCurrency(selectedCurrency),selectedCurrency
                  )}
                </Box>
              </Box>
            </SimpleGrid>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
