import React from "react";
import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";
import {
    formatAPY,
  formatBalanceCurrency,
  formatBalanceToken,
  mergeAaveSafetyModuleAddresses,
} from "../functions/utils";
import { formatUnits } from "viem";
import {
  Box,
  Card,
  CardHeader,
  Heading,
  Image,
  Tag,
  CardBody,
  VStack,
  StackDivider,
  SimpleGrid,
} from "@chakra-ui/react";
import { appSettings } from "../settings/appSettings";
import { aaveSafetyModule } from "../types/types";

interface Props {
  allActiveWallet: (AddressWallet | CustomWallet | Web3Wallet)[];
  selectedCurrency: string;
}

export default function CardAaveSafetyModule({
  allActiveWallet,
  selectedCurrency,
}: Props) {
  const allActiveWalletFiltered = allActiveWallet.filter(
    (activeAddress) => activeAddress.type === ("AddressWallet" || "Web3Wallet")
  ) as (AddressWallet | Web3Wallet)[];
  const aaveSafetyModuleMerged = mergeAaveSafetyModuleAddresses(
    allActiveWalletFiltered
  );

  //console.log(aaveSafetyModuleMerged.aave.stakeTokenUserBalance,stkAaveBalance);

  const safetyModuleBalance = (
    safetyModule: aaveSafetyModule["aave" | "bpt"]
  ) => {
    return Number(
      formatUnits(
        BigInt(safetyModule.stakeTokenUserBalance),
        safetyModule.decimals
      )
    );
  };

  const safetyModuleBalanceCurrency = (
    safetyModule: aaveSafetyModule["aave" | "bpt"],
    selectedCurrency: string
  ) => {
    //Balance * price
    return (
      safetyModuleBalance(safetyModule) *
      safetyModule.prices[
        selectedCurrency as keyof aaveSafetyModule["aave" | "bpt"]["prices"]
      ]
    );
  };

  // The total balance of safety module
  const totalSafetyModuleCurrency =
    safetyModuleBalanceCurrency(aaveSafetyModuleMerged.aave, selectedCurrency) +
    safetyModuleBalanceCurrency(aaveSafetyModuleMerged.bpt, selectedCurrency);

  //Create an array 
    const aaveSafetyModuleMergedArray = [];
  aaveSafetyModuleMerged.aave.stakeTokenUserBalance != "0" &&
    aaveSafetyModuleMergedArray.push(aaveSafetyModuleMerged.aave);
  aaveSafetyModuleMerged.bpt.stakeTokenUserBalance != "0" &&
    aaveSafetyModuleMergedArray.push(aaveSafetyModuleMerged.bpt);

  // Descending sorting of aaveSafetyModuleMerged
  aaveSafetyModuleMergedArray.sort(
    (a, b) =>
      Number(formatUnits(BigInt(b.stakeTokenUserBalance), b.decimals)) -
      Number(formatUnits(BigInt(a.stakeTokenUserBalance), a.decimals))
  );

  return totalSafetyModuleCurrency === 0 ? (
    <></>
  ) : (
    <Card>
      <CardHeader display={"flex"} alignItems={"center"} gap={5}>
        <Image boxSize={"55px"} src={appSettings.defi.aave.image}></Image>
        <Box>
          <Heading size="md" paddingBottom={2}>
            Aave Safety Module :{" "}
            {formatBalanceCurrency(totalSafetyModuleCurrency, selectedCurrency)}
          </Heading>
          <Tag variant="ethereum">Ethereum</Tag>
        </Box>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {aaveSafetyModuleMergedArray.map((safetyModule, index) => (
            <SimpleGrid
              key={index}
              columns={3}
              templateColumns={"50px 1fr auto"}
              spacingX={5}
            >
              <Box alignSelf={"center"}>
                <Image src={safetyModule.image} alt={safetyModule.name} />
              </Box>
              <Box>
                <Box>
                  <b>{safetyModule.name}</b>
                </Box>
                <Box>
                  {formatBalanceToken(
                    safetyModuleBalance(safetyModule),
                    safetyModule.symbol
                  )}
                </Box>
              </Box>
              <Box textAlign={"right"}>
                <Box>
                  {formatBalanceCurrency(
                    safetyModuleBalanceCurrency(safetyModule, selectedCurrency),
                    selectedCurrency
                  )}
                </Box>

                <Box>
                  APY : {formatAPY(Number(safetyModule.stakeApy)/10000)}
                </Box>
              </Box>
            </SimpleGrid>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
