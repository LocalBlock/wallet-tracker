import React, { useContext, useEffect, useRef, useState } from "react";
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
import { useSize } from "@chakra-ui/react-use-size"
import {
  formatBalanceCurrency,
  formatBalanceChange,
  mergeAaveToken,
  mergeBeefyToken,
  mergeTokensWallet,
  mergeCoinsWallet,
} from "../functions/utils";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { prices } from "../types/types";

import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  LineController
);

interface Props {
  allActiveWallet: (AddressWallet | CustomWallet | Web3Wallet)[];
  selectedChain: string[];
  selectedCurrency: string;
}
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

export default function ChartBalance({
  allActiveWallet,
  selectedChain,
  selectedCurrency,
}: Props) {
  const { userSettings } = useContext(UserSettingsContext);
  const chartRef = useRef<ChartJS>(null);
  const boxRef = useRef<HTMLDivElement>(null)
  const dimensions = useSize(boxRef) // To retreive dimensions fron div vhart container
  const [options, setOptions] = useState<ChartOptions>();

  const allActiveWalletFiltered = allActiveWallet.filter(
    (wallet) => wallet.type === ("AddressWallet" || "Web3Wallet")
  ) as (AddressWallet | Web3Wallet)[];
  const allActiveCustomWallet = allActiveWallet.filter(
    (wallet) => wallet.type === "CustomWallet"
  ) as CustomWallet[];

  // All token merge
  let allActiveTokens = mergeTokensWallet(allActiveWalletFiltered);
  // All coin merge from CustomWallet
  const allActiveCoins = mergeCoinsWallet(allActiveCustomWallet);
  // Add AaveToken
  allActiveTokens.push(...mergeAaveToken(allActiveWalletFiltered));
  // Add beefyToken
  allActiveTokens.push(...mergeBeefyToken(allActiveWalletFiltered));
  // Filter by sparkline and selectedChain
  allActiveTokens = allActiveTokens
    .filter((element) => element.sparkline_in_7d.price.length != 0)
    .filter((token) =>
      selectedChain.some((element) => element === token.chain)
    );

  const allActiveTokensCoins = [...allActiveTokens, ...allActiveCoins];

  const sparklineBalance = new Array(168).fill(0);
  let totalBalance = 0;
  let totalChange = 0;

  const currency24hChangePropName = (userSettings.currency +
    "_24h_change") as keyof prices;


  allActiveTokensCoins.forEach((tokenOrCoin) => {
    //Remove the first price, i suppose can be only one
    if (tokenOrCoin.sparkline_in_7d.price.length > 168)
      tokenOrCoin.sparkline_in_7d.price.shift();
    
      //fill array if not equal to 168
    if (tokenOrCoin.sparkline_in_7d.price.length < 168) {
      //prices array lenght to insert
      const priceToInsert = new Array(
        168 - tokenOrCoin.sparkline_in_7d.price.length
      );
      //Fill with the first price
      priceToInsert.fill(tokenOrCoin.sparkline_in_7d.price[0]);
      //Add in sparkline at beginning
      tokenOrCoin.sparkline_in_7d.price.splice(0, 0, ...priceToInsert);
    }
    //Calculate balance for each sparkline point
    const sparklineBalanceToken = tokenOrCoin.sparkline_in_7d.price.map(
      (x) => x * Number(tokenOrCoin.balance)
    );
    

    //Calculate total balance for each sparkline point
    for (const key in sparklineBalance) {
      sparklineBalance[key] =
        sparklineBalance[key] + sparklineBalanceToken[key];
    }
    //console.log(sparklineBalance);
    totalBalance += tokenOrCoin.getBalanceCurrency(selectedCurrency);
    totalChange +=
      ((tokenOrCoin.prices[currency24hChangePropName] ?? 0) / 100) *
      tokenOrCoin.getBalanceCurrency(selectedCurrency);
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


  // use a custom hook to have color background from chakra theme
  const bgColorValue = useBackgroundColor();
  // useEffect is only necessary because we need to have the canvas from the useref hook in order to manage gradient backgroundcolor
  // result ==> Dynamic gradient color
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    const gradient = chart.ctx.createLinearGradient(0, 0, 0, dimensions?dimensions.height:0);
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
  }, [bgColorValue,dimensions]);
  console.log("render chart");
  return (
    <Box height={"20vh"} ref={boxRef}>
      <Box
        //color={"InfoText"}
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
