import {
  Card,
  CardHeader,
  Box,
  Heading,
  Tag,
  CardBody,
  VStack,
  StackDivider,
  SimpleGrid,
  Image,
  Flex,
} from "@chakra-ui/react";
import React from "react";
import {
  formatBalanceCurrency,
  formatBalanceToken,
  formatAPY,
  mergeBeefyAddresses,
} from "../functions/utils";
import { appSettings } from "../settings/appSettings";
import { beefyBalance, prices } from "../types/types";

import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";

interface Props {
  allActiveWallet: (AddressWallet|CustomWallet|Web3Wallet)[];
  selectedChain: string[];
  selectedCurrency: string;
}

function getBalanceVault(vault: beefyBalance, currency: keyof prices) {
  // Manage balance between single/Multi asset vault
  let balanceVault = 0;
  if (!vault.defaultPrices || !vault.price) {
    // Single asset balance calcul from token prices
    balanceVault =
      Number(vault.currentBalanceHarvest) * vault.tokens[0].prices[currency];
  } else {
    // Multi asset balance calcul
    // if currency is not 'usd take defaultPrices (USDC) for conversion of balance, otherwise vault price is already in USD
    balanceVault =
      Number(vault.currentBalanceHarvest) *
      vault.price *
      (currency != "usd" ? vault.defaultPrices[currency] : 1);
  }
  return balanceVault;
}

function getVaultImage(vault: beefyBalance) {
  let image: JSX.Element = <></>;
  if (vault.tokens.length === 1) {
    image = <Image src={vault.tokens[0].image} />;
  }
  if (vault.tokens.length === 2) {
    image = (
      <>
        <Image
          src={vault.tokens[0].image}
          transform="translate(-10px) scale(0.8)"
        />
        <Image
          src={vault.tokens[1].image}
          transform="translate(-40px) scale(0.8)"
        />
      </>
    );
  }
  if (vault.tokens.length === 3) {
    image = (
      <>
        <Image
          src={vault.tokens[0].image}
          transform="translate(-10px,-10px) scale(0.7)"
        />
        <Image
          src={vault.tokens[1].image}
          transform="translate(-40px,-10px) scale(0.7)"
        />
        <Image
          src={vault.tokens[2].image}
          transform="translate(-100px,10px) scale(0.7)"
        />
      </>
    );
  }
  return <Flex>{image}</Flex>;
}

export default function CardBeefy({
  allActiveWallet,
  selectedChain,
  selectedCurrency,
}: Props) {
  const allActiveWalletFiltered=allActiveWallet.filter(wallet=>wallet.type===("AddressWallet"||"Web3Wallet")) as (AddressWallet|Web3Wallet)[];

  let beefyData = mergeBeefyAddresses(allActiveWalletFiltered);

  //Filter by chain
  beefyData = beefyData.filter((vault) =>
    selectedChain.some((element) => vault.chain === element)
  );

  let totalBalanceBeefy = 0;
  beefyData.forEach((vault) => {
    totalBalanceBeefy += getBalanceVault(
      vault,
      selectedCurrency as keyof prices
    );
  });

  return totalBalanceBeefy === 0 ? (
    <></>
  ) : (
    <Card>
      <CardHeader display={"flex"} alignItems={"center"} gap={5}>
        <Image boxSize={"55px"} src={appSettings.defi.beefy.image}></Image>

        <Heading size="md" paddingBottom={2}>
          Beefy : {formatBalanceCurrency(totalBalanceBeefy, selectedCurrency)}
        </Heading>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {beefyData.map((vault, index) => (
            <SimpleGrid
              key={index}
              columns={3}
              templateColumns={"50px 1fr auto"}
              spacingX={5}
            >
              <Box alignSelf={"center"}>{getVaultImage(vault)}</Box>
              <Box>
                <Box>
                  <b>{vault.name} </b>
                  <Tag variant={vault.chain}>
                    {
                      appSettings.chains.find(
                        (chain) => chain.id === vault.chain
                      )?.name
                    }
                  </Tag>
                </Box>
                <Box>
                  {formatBalanceToken(Number(vault.currentBalanceHarvest), "")}
                </Box>
              </Box>
              <Box textAlign={"right"}>
                <Box>
                  {formatBalanceCurrency(
                    getBalanceVault(vault, selectedCurrency as keyof prices),
                    selectedCurrency
                  )}
                </Box>

                <Box>APY : {formatAPY(Number(vault.apy))}</Box>
              </Box>
            </SimpleGrid>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
