import React from "react";
import {
  formatAPY,
  formatBalanceCurrency,
  formatBalanceToken,
  mergeAaveAddresses,
} from "../functions/utils";
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  VStack,
  StackDivider,
  SimpleGrid,
  Box,
  Image,
  Tag,
} from "@chakra-ui/react";

import { aaveBalance, appSettingsType } from "../types/types";
import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";
import { appSettings } from "../settings/appSettings";

interface Props {
  allActiveWallet: (AddressWallet | CustomWallet | Web3Wallet)[];
  chainId: appSettingsType["chains"][number]["id"];
  selectedCurrency: string;
  version: "V2" | "V3";
}

export default function CardAave({
  allActiveWallet,
  chainId,
  selectedCurrency,
  version,
}: Props) {
  const allActiveWalletFiltered = allActiveWallet.filter(
    (activeAddress) => activeAddress.type === ("AddressWallet" || "Web3Wallet")
  ) as (AddressWallet | Web3Wallet)[];
  const aaveData = mergeAaveAddresses(
    allActiveWalletFiltered,
    version,
    chainId
  );

  // Descending sorting of reserveData
  aaveData.userReservesData.sort(
    (a, b) => Number(b.underlyingBalanceUSD) - Number(a.underlyingBalanceUSD)
  );

  //Calculate totalBalance
  let totalBalanceReserveCurrency = 0;
  aaveData.userReservesData.forEach((reserveData) => {
    totalBalanceReserveCurrency +=
      Number(reserveData.underlyingBalance) *
      reserveData.prices[
        selectedCurrency as keyof aaveBalance["userReservesData"][number]["prices"]
      ];
  });

  return totalBalanceReserveCurrency === 0 ? (
    <></>
  ) : (
    <Card>
      <CardHeader display={"flex"} alignItems={"center"} gap={5}>
        <Image boxSize={"55px"} src={appSettings.defi.aave.image}></Image>
        <Box>
          <Heading size="md" paddingBottom={2}>
            Aave{version} :{" "}
            {formatBalanceCurrency(
              totalBalanceReserveCurrency,
              selectedCurrency
            )}
          </Heading>
          <Tag variant={chainId}>
            {appSettings.chains.find((chain) => chain.id === chainId)?.name ??
              "MultiChains"}
          </Tag>
        </Box>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {aaveData.userReservesData.map((reserveData, index) => (
            <SimpleGrid
              key={index}
              columns={3}
              templateColumns={"50px 1fr auto"}
              spacingX={5}
            >
              <Box alignSelf={"center"}>
                <Image src={reserveData.image} alt={reserveData.reserve.name} />
              </Box>
              <Box>
                <Box>
                  <b>
                    {reserveData.reserve.name} {version}
                  </b>
                </Box>
                <Box>
                  {formatBalanceToken(
                    Number(reserveData.underlyingBalance),
                    reserveData.reserve.symbol.toUpperCase()
                  )}
                </Box>
              </Box>
              <Box textAlign={"right"}>
                <Box>
                  {formatBalanceCurrency(
                    Number(reserveData.underlyingBalance) *
                      reserveData.prices[
                        selectedCurrency as keyof aaveBalance["userReservesData"][number]["prices"]
                      ],
                    selectedCurrency
                  )}
                </Box>

                <Box>
                  APY : {formatAPY(Number(reserveData.reserve.supplyAPY))}
                </Box>
              </Box>
            </SimpleGrid>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
