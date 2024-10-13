import {
  Card,
  CardBody,
  CardHeader,
  Image,
  VStack,
  Box,
  StackDivider,
  Heading,
  Tag,
  Text,
  Flex,
} from "@chakra-ui/react";
import {
  formatBalanceCurrency,
  formatBalanceToken,
  formatBalanceChange,
} from "@/lib/utils";

import { appSettings } from "@/app/appSettings";
import { FetchCoinPrices } from "@/types";
import { getUserAssets } from "@/lib/assets";

type Props = {
  allAssets: ReturnType<typeof getUserAssets>;
  selectedChains: string[];
  currency: string;
};

export default function WalletCard({
  allAssets,
  selectedChains,
  currency,
}: Props) {
  const selectedCurrency = currency as keyof FetchCoinPrices[number];
  const selectedCurrency_24h_change = (currency +
    "_24h_change") as keyof FetchCoinPrices[number];

  //filter chain and if there is no price in coin data
  const assetFiltered = allAssets
    .filter(
      (asset) =>
        selectedChains.includes(asset.chain) || asset.chain === "custom"
    )
    .filter((asset) => JSON.stringify(asset.price) != "{}");

  // Sort Assets, Descent
  assetFiltered.sort(
    (a, b) =>
      b.price[selectedCurrency] * Number(b.balance) -
      a.price[selectedCurrency] * Number(a.balance)
  );

  //Calculate totalBalance
  let totalBalance = 0;
  assetFiltered.forEach((asset) => {
    totalBalance += asset.price[selectedCurrency] * Number(asset.balance);
  });

  return (
    <Card>
      <CardHeader>
        <Heading size="md">
          Wallet : {formatBalanceCurrency(totalBalance, selectedCurrency)}
        </Heading>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {assetFiltered.map((asset, index) => (
            <Flex key={index} justifyContent={"space-between"}>
              <Flex gap={3} align={"center"}>
                <Image src={asset.image} alt={asset.name} boxSize={"50px"} />
                <Box>
                  <b>{asset.name} </b>
                  {asset.chain && (
                    <Tag variant={asset.chain}>
                      {appSettings.chains.find(
                        (chain) => chain.id === asset.chain
                      )?.name ?? "Custom Wallet"}
                    </Tag>
                  )}
                  <Text>
                    {formatBalanceToken(Number(asset.balance))}&nbsp;
                    {asset.symbol.toUpperCase()}
                  </Text>
                </Box>
              </Flex>
              <Box>
                <Box textAlign={"right"}>
                  <Text>
                    {formatBalanceCurrency(
                      Number(asset.balance) * asset.price[selectedCurrency],
                      selectedCurrency
                    )}
                  </Text>
                  <Text
                    color={
                      asset.price[selectedCurrency_24h_change] >= 0
                        ? "green"
                        : "red"
                    }
                  >
                    {formatBalanceChange(
                      asset.price[selectedCurrency_24h_change],
                      Number(asset.balance) * asset.price[selectedCurrency],
                      selectedCurrency
                    )}
                  </Text>
                </Box>
              </Box>
            </Flex>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
