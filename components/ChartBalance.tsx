import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  ChartOptions,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import {
  Box,
  Heading,
  useColorMode,
  useTheme,
  useToken,
} from "@chakra-ui/react";
import { useSize } from "@chakra-ui/react-use-size";
import { formatBalanceCurrency, formatBalanceChange } from "@/lib/utils";

import { FetchCoinMarket, FetchCoinPrices } from "@/types";
import { getUserAssets, getUserDefi } from "@/lib/assets";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  LineController
);

/**
 * Custom hook, provide the background color value from chakra theme
 * @returns Css color
 */
function useBackgroundColor() {
  const theme = useTheme();
  const lightBgColorTheme =
    theme.semanticTokens.colors["chakra-body-bg"]._light;
  const darkBgColorTheme = theme.semanticTokens.colors["chakra-body-bg"]._dark;

  const [lightColorValue, darkColorValue] = useToken("colors", [
    lightBgColorTheme,
    darkBgColorTheme,
  ]);
  const { colorMode } = useColorMode();
  switch (colorMode) {
    case "light":
      return lightColorValue;
    case "dark":
      return darkColorValue;
  }
}

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
  const chartRef = useRef<ChartJS>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dimensions = useSize(boxRef); // To retreive dimensions fron div vhart container
  const [options, setOptions] = useState<ChartOptions>();

  // use a custom hook to have color background from chakra theme
  const bgColorValue = useBackgroundColor();
  // useEffect is only necessary because we need to have the canvas from the useref hook in order to manage gradient backgroundcolor
  // result ==> Dynamic gradient color
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    const gradient = chart.ctx.createLinearGradient(
      0,
      0,
      0,
      dimensions ? dimensions.height : 0
    );
    // console.log('top',chart.chartArea.top);
    // console.log('bottom',chart.chartArea.bottom);

    //upper color
    gradient.addColorStop(0, "#81E6D9");
    //Bottom color
    gradient.addColorStop(1, bgColorValue);

    const options = {
      //responsive: false,
      maintainAspectRatio: false,
      elements: {
        line: {
          borderColor: "#38B2AC", //Line color
          fill: true,
          backgroundColor: gradient, //Line fill color
          //borderWidth: 1,
          cubicInterpolationMode: "monotone" as const,
          tension: 0.5,
        },
        point: {
          radius: 0,
        },
      },
      plugins: {},
      scales: {
        x: {
          display: false,
        },

        y: {
          display: false,
        },
      },
    };
    setOptions(options);
  }, [bgColorValue, dimensions]);

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

  userDefi?.aaveV2
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

  userDefi?.beefy
    .filter((bf) => selectedChains.includes(bf.chain))
    .forEach((vault) => {
      defiTokens.push({
        balance: vault.currentBalanceHarvest,
        balanceCurrency:
          Number(vault.currentBalanceHarvest) * vault.price[selectedCurrency],
        balanceCurrencyChange:
          (vault.price[currency24hChangePropName] ?? 0) / 100,
        sparkline: vault.sparkline_in_7d,
      });
    });

  // Merge all and remove if no sparklinedata
  const allAsset = [...tokens, ...defiTokens].filter(
    (element) => element.sparkline.price.length != 0
  );

  const sparklineBalance = new Array(168).fill(0);
  let totalBalance = 0;
  let totalChange = 0;

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
    //Calculate balance for each sparkline point
    const sparklineBalanceToken = asset.sparkline.price.map(
      (x) => x * Number(asset.balance)
    );

    //Calculate total balance for each sparkline point
    for (const key in sparklineBalance) {
      sparklineBalance[key] =
        sparklineBalance[key] + sparklineBalanceToken[key];
    }
    //console.log(sparklineBalance);
    totalBalance += asset.balanceCurrency;
    //console.log(asset.balanceCurrency)
    totalChange += asset.balanceCurrencyChange * asset.balanceCurrency;
  });

  const labels = sparklineBalance;
  const data = {
    labels,
    datasets: [
      {
        //label: 'Dataset 1',
        data: sparklineBalance,
      },
    ],
  };
  const totalPercentage = (totalChange * 100) / totalBalance;

  return (
    <Box height={"20vh"} ref={boxRef}>
      <Box
        position={"absolute"}
        marginLeft={"20px"}
        marginTop={"10px"}
        textShadow={"2px 2px 7px rgb(0 0 0 / 50%)"}
      >
        <Heading>
          {formatBalanceCurrency(totalBalance, selectedCurrency)}{" "}
        </Heading>
        <Heading size={"lg"} color={totalPercentage > 0 ? "green" : "red"}>
          {formatBalanceChange(totalPercentage, totalBalance, selectedCurrency)}
        </Heading>
      </Box>
      <Chart type="line" ref={chartRef} options={options} data={data} />
    </Box>
  );
}
