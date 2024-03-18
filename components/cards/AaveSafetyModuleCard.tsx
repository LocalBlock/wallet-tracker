import {
  formatAPY,
  formatBalanceCurrency,
  formatBalanceToken,
} from "@/lib/utils";
import {
  Box,
  Card,
  CardHeader,
  Image,
  Heading,
  Tag,
  CardBody,
  VStack,
  StackDivider,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { FetchCoinPrices } from "@/types";
import { appSettings } from "@/app/appSettings";
import { getDefi } from "@/app/actions/asset";

type Props = {
  data: Awaited<ReturnType<typeof getDefi>>["aaveSafetymodule"];
  currency: string;
  selectedChains: string[];
};

export default function AaveSafetyModuleCard({
  data,
  currency,
  selectedChains,
}: Props) {
  if (data.length === 0) return null;
  const selectedCurrency = currency as keyof FetchCoinPrices[number];

  // Filter chains
  const smFiltered = data.filter((sm) => selectedChains.includes(sm.chain));

  // The total balance of safety module
  const totalSafetyModuleCurrency = smFiltered.reduce(
    (acc, currentValue) =>
      acc + currentValue.balance * currentValue.price[selectedCurrency],
    0
  );

  // Descending sorting of safetyModuleMergedArray
  smFiltered.sort(
    (a, b) =>
      b.balance * b.price[selectedCurrency] -
      a.balance * b.price[selectedCurrency]
  );

  return totalSafetyModuleCurrency === 0 ? null : (
    <Card>
      <CardHeader display={"flex"} alignItems={"center"} gap={5}>
        <Image
          boxSize={55}
          src={"/" + appSettings.defi.aave.image}
          alt="Aave"
        />
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
          {smFiltered.map((safetyModule, index) => (
            <Flex key={index} justifyContent={"space-between"}>
              <Flex gap={3} align={"center"}>
                <Image
                  src={safetyModule.image}
                  alt={safetyModule.name}
                  boxSize={"50px"}
                />

                <Box>
                  <Box>
                    <b>{safetyModule.name}</b>
                  </Box>
                  <Box>
                    {formatBalanceToken(safetyModule.balance) +
                      " " +
                      safetyModule.symbol.toUpperCase()}
                  </Box>
                  <Box >
                    Claimable : {formatBalanceToken(safetyModule.balanceToClaim) +
                      " AAVE"}
                  </Box>
                </Box>
              </Flex>
              <Box textAlign={"right"} my={"auto"}>
                <Box>
                  {formatBalanceCurrency(
                    safetyModule.balance * safetyModule.price[selectedCurrency],
                    selectedCurrency
                  )}
                </Box>
                <Box>
                  APY : {formatAPY(Number(safetyModule.stakeApy) / 10000)}
                </Box>
              </Box>
            </Flex>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
