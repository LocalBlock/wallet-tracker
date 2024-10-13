import {
  Card,
  CardHeader,
  Box,
  Heading,
  Tag,
  CardBody,
  VStack,
  StackDivider,
  Image,
  Flex,
} from "@chakra-ui/react";
import {
  formatBalanceCurrency,
  formatBalanceToken,
  formatAPY,
} from "@/lib/utils";
import { appSettings } from "@/app/appSettings";
import { FetchCoinPrices } from "@/types";
import { getUserDefi } from "@/lib/assets";

type Props = {
  data: Awaited<ReturnType<typeof getUserDefi>>["beefy"];
  currency: string;
  selectedChains: string[];
};

function getVaultImage(tokens: Props["data"][number]["tokens"]) {
  let image: JSX.Element = <></>;
  if (tokens.length === 1) {
    image = (
      <Image src={tokens[0].image} alt={tokens[0].name} boxSize={"50px"} />
    );
  }
  if (tokens.length === 2) {
    image = (
      <>
        <Image
          src={tokens[0].image}
          transform="translate(-10px) scale(0.8)"
          alt={tokens[0].name}
          boxSize={"50px"}
        />
        <Image
          src={tokens[1].image}
          transform="translate(-40px) scale(0.8)"
          alt={tokens[1].name}
          boxSize={"50px"}
        />
      </>
    );
  }
  if (tokens.length === 3) {
    image = (
      <>
        <Image
          src={tokens[0].image}
          transform="translate(-10px,-10px) scale(0.7)"
          alt={tokens[0].name}
          boxSize={"50px"}
        />
        <Image
          src={tokens[1].image}
          transform="translate(-40px,-10px) scale(0.7)"
          alt={tokens[1].name}
          boxSize={"50px"}
        />
        <Image
          src={tokens[2].image}
          transform="translate(-100px,10px) scale(0.7)"
          alt={tokens[2].name}
          boxSize={"50px"}
        />
      </>
    );
  }
  return <Flex width={"55px"}>{image}</Flex>;
}

export default function BeefyCard({ data, selectedChains, currency }: Props) {
  const selectedCurrency = currency as keyof FetchCoinPrices[number];
  const beefyFiltered = data.filter((bf) => selectedChains.includes(bf.chain));

  // Descending sorting of beefyVault
  beefyFiltered.sort(
    (a, b) =>
      Number(b.currentBalanceHarvest) * b.price[selectedCurrency] -
      Number(a.currentBalanceHarvest) * a.price[selectedCurrency]
  );

  // Calculate total balance
  let totalBalanceBeefy = 0;
  beefyFiltered.forEach((vault) => {
    totalBalanceBeefy +=
      Number(vault.currentBalanceHarvest) * vault.price[selectedCurrency];
  });

  return (
    <Card>
      <CardHeader display={"flex"} alignItems={"center"} gap={5}>
        <Image
          boxSize={"55px"}
          src={"/" + appSettings.defi.beefy.image}
          alt="Beefy"
        ></Image>

        <Heading size="md" paddingBottom={2}>
          Beefy : {formatBalanceCurrency(totalBalanceBeefy, selectedCurrency)}
        </Heading>
      </CardHeader>
      <CardBody>
        <VStack
          align={"stretch"}
          divider={<StackDivider borderColor="gray.200" />}
        >
          {beefyFiltered.map((vault, index) => (
            <Flex key={index} justifyContent={"space-between"}>
              <Flex gap={3} align={"center"}>
                {getVaultImage(vault.tokens)}
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
                    {formatBalanceToken(Number(vault.currentBalanceHarvest))}
                  </Box>
                </Box>
              </Flex>
              <Box textAlign={"right"}>
                <Box>
                  {formatBalanceCurrency(
                    Number(vault.currentBalanceHarvest) *
                      vault.price[selectedCurrency],
                    selectedCurrency
                  )}
                </Box>
                <Box>APY : {formatAPY(Number(vault.apy))}</Box>
              </Box>
            </Flex>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}
