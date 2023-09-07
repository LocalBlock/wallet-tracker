import { IconButton, Spinner, Text, Tooltip } from "@chakra-ui/react";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AllWalletContext } from "../contexts/AllWalletContext";
import { ServerStatusContext } from "../contexts/ServerStatusContext";
import { getAllWallet, getCoinList } from "../functions/localstorage";
import { appSettings } from "../settings/appSettings";
import {
  getAllCoinID,
  getCoinMarket,
  getCoinPrices,
} from "../functions/coingecko";
import { AddressWallet, Web3Wallet } from "../classes/Wallet";
import { fetchCoinMarket, fetchCoinPrices } from "../types/types";
import { convertFetchTime } from "../functions/utils";

export default function FetchIndicator() {
  const { allWallet, setAllWallet } = useContext(AllWalletContext);
  const { serverStatus } = useContext(ServerStatusContext);

  const [fetchStatus, setFetchStatus] = useState<
    "fetching" | "fail" | "success" | undefined
  >(undefined);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [forceUpdate, setForceUpdate] = useState(false);

  const isFetching = useRef(false); // use to manage the "double" useEffect, prevent simultaneous execution of fetchHandler
  useEffect(() => {
    async function fetchHandler(forceUpdate: boolean) {
      if (!serverStatus.isApiKey || !serverStatus.isConnected) {
        setFetchStatus(undefined);
        return null;
      }
      if (isFetching.current) return null;

      isFetching.current = true;
      setFetchStatus("fetching");
      const errorMessagesTemp = [];
      let isError = false;
      let isBalanceFetched = false;
      let isPricesFetched = false;

      // Step 1 : Fetch coinList if no or outdated data in localstorage
      const lsCoinList = getCoinList();
      if (
        !lsCoinList ||
        Date.now() - lsCoinList.lastFetch > appSettings.fetchDelayCoinList
      )
        await getAllCoinID(); //Fetch coinList from CoinGecko

      // Step 2 : Fetch balance on each wallets
      for (const wallet of allWallet) {
        try {
          if (wallet instanceof (AddressWallet || Web3Wallet))
            //Fecthing balance only on AddresWallet
            isBalanceFetched = await wallet.fetchBalance(forceUpdate);
        } catch (error) {
          isError = true;
          errorMessagesTemp.push(
            "Fetch balance error on " +
              wallet.displayName +
              ", Cause : " +
              (error as Error).message
          );
        }
      }
      // Step 3 : Fetch Prices
      // Get All coinId from All wallet
      let allCoinIdAllWallet: string[] = [];
      for (const wallet of allWallet) {
        allCoinIdAllWallet.push(...wallet.getAllCoinID());
      }
      allCoinIdAllWallet = [...new Set(allCoinIdAllWallet)]; //Remove duplicate
      // Fetch prices
      let responseMarket: fetchCoinMarket[] = [];
      let responsePrices: fetchCoinPrices = {};
      try {
        if (
          allWallet.length != 0 &&
          (Date.now() - allWallet[0].lastFetchPrices > // Check lastfetchPrices only on first wallet
            appSettings.fetchDelayPrices ||
            isBalanceFetched ||
            forceUpdate)
        ) {
          console.log("Fetch market data");
          responseMarket = await getCoinMarket(allCoinIdAllWallet.join(","));
          console.log("Fetch prices");
          responsePrices = await getCoinPrices(allCoinIdAllWallet.join(","));
          isPricesFetched = true;
        } else console.log("[All wallets] No need to fetch prices");
      } catch (error) {
        isError = true;
        errorMessagesTemp.push(
          "Fetch prices error, Cause : " + (error as Error).message
        );
      }
      //Update wallets object
      if (isPricesFetched) {
        for (const wallet of allWallet) {
          wallet.updatePrices(responseMarket, responsePrices);
        }
      }
      //Update states
      if (isError) {
        setFetchStatus("fail");
        setErrorMessages(errorMessagesTemp);
      } else {
        if (allWallet.length === 0) setFetchStatus(undefined);
        else {
          setFetchStatus("success");
          if (isBalanceFetched || isPricesFetched) setAllWallet(getAllWallet());
        }
      }
      isFetching.current = false;
      setForceUpdate(false);
    }

    console.log("useEffect Fetch");
    fetchHandler(forceUpdate);
    const intervalID = setInterval(() => {
      fetchHandler(false);
    }, appSettings.intervalCheck);
    return () => {
      clearInterval(intervalID);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWallet, forceUpdate, serverStatus.isApiKey]);

  let color = "";
  let tooltipLabel: JSX.Element;
  switch (fetchStatus) {
    case "fail":
      color = "red";
      tooltipLabel = (
        <>
          {errorMessages.map((error, index) => (
            <Text key={index}>{error}</Text>
          ))}
        </>
      );
      break;
    case "fetching":
      color = "yellow";
      tooltipLabel = <Text>Fetching Data...</Text>;
      break;
    case "success":
      color = "green";
      tooltipLabel = (
        <>
          <Text align={"center"}>Last fetch :</Text>
          <Text>
            {allWallet.length && convertFetchTime(allWallet[0].lastFetchPrices)}
          </Text>
          <Text>Click to force update</Text>
        </>
      );
      break;
    default:
      color = "grey";
      tooltipLabel = (
        <Text>No wallet or no Api key or not connected to server</Text>
      );
      break;
  }
  return (
    <Tooltip label={tooltipLabel}>
      <IconButton
        aria-label="Status"
        icon={
          fetchStatus === "fetching" ? (
            <Spinner />
          ) : (
            <FontAwesomeIcon icon={faCircle} />
          )
        }
        color={color}
        onClick={() => setForceUpdate(true)}
      />
    </Tooltip>
  );
}
