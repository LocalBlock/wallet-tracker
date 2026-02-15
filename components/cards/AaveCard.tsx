import { appSettings } from "@/app/appSettings";
import { getUserDefi } from "@/lib/assets";
import {
  formatBalanceCurrency,
  formatBalanceToken,
  formatAPY,
} from "@/lib/utils";
import { FetchCoinPrices } from "@/types";
import {
  Card,
  CardHeader,
  Image,
  Heading,
  Tag,
  CardBody,
  VStack,
  StackDivider,
  Box,
  Flex,
} from "@chakra-ui/react";

type Props = {
  version: string;
  currency: string;
  selectedChains: string[];
  data: Awaited<ReturnType<typeof getUserDefi>>["aaveV3"];
};

export default function AaveCard({
  version,
  currency,
  selectedChains,
  data,
}: Props) {
  const selectedCurrency = currency as keyof FetchCoinPrices[number];

  // Filter chain
  const aavePoolsFiltered = data.filter((ap) =>
    selectedChains.includes(ap.chain)
  );

  // Calcul totalBalance card
  let totalBalance = 0;
  aavePoolsFiltered.forEach((token) => {
    totalBalance +=
      Number(token.underlyingBalance) * token.price[selectedCurrency];
  });

  // Descending sorting
  aavePoolsFiltered.sort(
    (a, b) =>
      Number(b.underlyingBalance) * b.price[selectedCurrency] -
      Number(a.underlyingBalance) * a.price[selectedCurrency]
  );

  return (
    <Card>
      <CardHeader display={"flex"} alignItems={"center"} gap={5}>
        <Image
          boxSize={"55px"}
          src={appSettings.defi.aave.image}
          alt="Aave"
        ></Image>
        <Box>
          <Heading size="md" paddingBottom={2}>
            Aave&nbsp;{version} :{" "}
            {formatBalanceCurrency(totalBalance, selectedCurrency)}
          </Heading>
        </Box>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {aavePoolsFiltered.map((reserveData, index) => (
            <Flex key={index} justifyContent={"space-between"}>
              <Flex gap={3} align={"center"}>
                <Image
                  src={reserveData.image}
                  alt={reserveData.reserve.name}
                  boxSize={"50px"}
                />
                <Box>
                  <Box>
                    <b>
                      {reserveData.reserve.name} {version}
                    </b>
                    &nbsp;
                    <Tag variant={reserveData.chain}>
                      {appSettings.chains.find(
                        (chain) => chain.id === reserveData.chain
                      )?.name ?? "MultiChains"}
                    </Tag>
                  </Box>
                  <Box>
                    {formatBalanceToken(Number(reserveData.underlyingBalance)) +
                      " " +
                      reserveData.reserve.symbol.toUpperCase()}
                  </Box>
                </Box>
              </Flex>
              <Box textAlign={"right"}>
                <Box>
                  {formatBalanceCurrency(
                    Number(reserveData.underlyingBalance) *
                      reserveData.price[selectedCurrency],
                    selectedCurrency
                  )}
                </Box>
                <Box>
                  APY : {formatAPY(Number(reserveData.reserve.supplyAPY))}
                </Box>
              </Box>
            </Flex>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
