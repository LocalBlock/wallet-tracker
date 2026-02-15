import { Box, Text, useToken } from "@chakra-ui/react";
import { formatBalanceCurrency, formatBalanceChange } from "@/lib/utils";
import { FetchCoinMarket, FetchCoinPrices } from "@/types";
import { getUserAssets, getUserDefi } from "@/lib/assets";
import {
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
} from "recharts";

type ChartTokens = {
  balance: string;
  balanceCurrency: number;
  balanceCurrencyChange: number;
  sparkline: FetchCoinMarket["sparkline_in_7d"];
};

type Props = {
  userAssets: ReturnType<typeof getUserAssets>;
  userDefi: ReturnType<typeof getUserDefi>;
  selectedChains: string[];
  currency: string;
};

export default function ChartBalance({
  userAssets,
  userDefi,
  selectedChains,
  currency,
}: Props) {
  // Retreive some chakra colors from semantic tokens
  const [chakraBackgroundColor, chakraBorderColor] = useToken(
    "semanticTokens",
    ["colors.chakra-body-bg", "colors.chakra-border-color"]
  );

  const selectedCurrency = currency as keyof FetchCoinPrices[number];
  const currency24hChangePropName = (currency +
    "_24h_change") as keyof FetchCoinPrices[number];

  // Tokens
  const tokens: ChartTokens[] = [];
  userAssets
    ?.filter(
      (asset) =>
        selectedChains.includes(asset.chain) || asset.chain === "custom"
    )
    .forEach((asset) => {
      tokens.push({
        balance: asset.balance,
        balanceCurrency: Number(asset.balance) * asset.price[selectedCurrency],
        balanceCurrencyChange:
          (asset.price[currency24hChangePropName] ?? 0) / 100,
        sparkline: asset.sparkline_in_7d,
      });
    });

  // Defi
  const defiTokens: ChartTokens[] = [];
  userDefi?.aaveSafetymodule
    .filter((sm) => selectedChains.includes(sm.chain))
    .forEach((sm) => {
      defiTokens.push({
        balance: sm.balance.toString(),
        balanceCurrency: sm.balance * sm.price[selectedCurrency],
        balanceCurrencyChange: (sm.price[currency24hChangePropName] ?? 0) / 100,
        sparkline: sm.sparkline_in_7d,
      });
    });

  userDefi?.aaveV3
    .filter((ap) => selectedChains.includes(ap.chain))
    .forEach((ap) => {
      defiTokens.push({
        balance: ap.underlyingBalance,
        balanceCurrency:
          Number(ap.underlyingBalance) * ap.price[selectedCurrency],
        balanceCurrencyChange: (ap.price[currency24hChangePropName] ?? 0) / 100,
        sparkline: ap.sparkline_in_7d,
      });
    });

  // Merge all and remove if no sparklinedata
  const allAsset = [...tokens, ...defiTokens].filter(
    (element) => element.sparkline.price.length != 0
  );

  // build sparkline from all assets
  //console.log(allAsset)
  const sparklineBalance = new Array<number>(168).fill(0); // Start with a arry of 0
  let totalBalance = 0;
  let totalChange = 0;
  // The sparkline_in_7d is ONLY in usd, we can determine conversion rate with the firts asset.
  // It will be approximative but ok, no?
  const usdConversionRate =
    userAssets[0].price[selectedCurrency] / userAssets[0].price.usd;

  allAsset.forEach((asset) => {
    //Remove the first price, i suppose can be only one
    if (asset.sparkline.price.length > 168) asset.sparkline.price.shift();

    //fill array if not equal to 168
    if (asset.sparkline.price.length < 168) {
      //prices array lenght to insert
      const priceToInsert = new Array(168 - asset.sparkline.price.length);
      //Fill with the first price
      priceToInsert.fill(asset.sparkline.price[0]);
      //Add in sparkline at beginning
      asset.sparkline.price.splice(0, 0, ...priceToInsert);
    }
    //Calculate balance for each sparkline point with usd convertion rate
    const sparklineBalanceToken = asset.sparkline.price.map(
      (usdPrice) => usdPrice * usdConversionRate * Number(asset.balance)
    );

    //Calculate total balance for each sparkline point
    for (const key in sparklineBalance) {
      sparklineBalance[key] =
        sparklineBalance[key] + sparklineBalanceToken[key];
    }

    // increment total balance
    totalBalance += asset.balanceCurrency;
    // increment total change
    totalChange += asset.balanceCurrencyChange * asset.balanceCurrency;
  });

  const totalPercentage = (totalChange * 100) / totalBalance;

  // Data array for recharts
  // Coingecko sparline_in_7d is updated every 6hours. There 168 items per asset, so one point is 1 hour
  // We can aproximatively determine the date for each sparkline point
  const data = sparklineBalance.map((value, index) => {
    return {
      date: new Date(
        Date.now() -
          3 * 60 * 60 * 1000 - // 3 for "cut" the 6 hours delay
          7 * 24 * 60 * 60 * 1000 +
          index * 1 * 60 * 60 * 1000
      ).toLocaleString(undefined, {
        day: "numeric",
        month: "long",
        hour: "numeric",
      }),
      balance: Math.round(value),
    };
  });

  return (
    <Box height={"20vh"}>
      <Box
        position={"absolute"}
        marginLeft={"20px"}
        textShadow={"2px 2px 7px rgb(0 0 0 / 50%)"}
      >
        <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight={"bold"}>
          {formatBalanceCurrency(totalBalance, selectedCurrency)}{" "}
        </Text>
        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontWeight={"bold"}
          color={totalPercentage > 0 ? "green" : "red"}
        >
          {formatBalanceChange(totalPercentage, totalBalance, selectedCurrency)}
        </Text>
      </Box>
      {/* Recharts */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 2,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chakra-colors-purple-500)"
                stopOpacity={0.8}
              />
              <stop
                offset="100%"
                stopColor="var(--chakra-colors-purple-500)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis hide={true} dataKey="date" />
          <YAxis
            hide={true}
            type="number"
            domain={([dataMin, dataMax]) => [
              dataMin - (dataMax - dataMin) * 0.2,
              dataMax,
            ]}
          />
          <Tooltip
            formatter={(value) =>
              formatBalanceCurrency(Number(value), selectedCurrency)
            }
            contentStyle={{
              backgroundColor: chakraBackgroundColor,
              borderColor: chakraBorderColor,
              borderRadius: "var(--chakra-radii-lg)",
            }}
          />
          <Area
            type="natural"
            dataKey="balance"
            name="Balance"
            dot={false}
            stroke={
              totalPercentage >= 0
                ? "var(--chakra-colors-green-600)"
                : "var(--chakra-colors-red-600)"
            } // Couleur de la ligne
            strokeWidth={3} // Epaisseur de la ligne
            fill="url(#balanceGradient)" // Remplissage via le linear gradient
            activeDot={{ r: 5 }}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
