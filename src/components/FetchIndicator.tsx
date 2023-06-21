import { IconButton, Stack, Text, Tooltip } from "@chakra-ui/react";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AllWalletContext } from "../contexts/AllWalletContext";
import { getAllWallet, getCoinList } from "../functions/localstorage";
import { appSettings } from "../settings/appSettings";
import { getAllCoinID } from "../functions/coingecko";

export default function FetchIndicator() {
  const { allWallet, setAllWallet } = useContext(AllWalletContext);

  const [fetchStatus, setFetchStatus] = useState<
    "fetching" | "fail" | "success" | undefined
  >(undefined);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const isFetching = useRef(false); // use to manage the "double" useEffect, prevent simultaneous execution of fetch dat
  useEffect(() => {
    async function fetchHandler() {
      if (!isFetching.current) {
        isFetching.current = true;
        setFetchStatus("fetching");
        const errorMessagesTemp = [];
        let isError = false;
        let isFetched = false;

        //Fetch coinList if no or outdated data in localstorage 
        const lsCoinList = getCoinList();
        if (
          !lsCoinList ||
          Date.now() - lsCoinList.lastFetch > appSettings.fetchDelayCoinList
        )
          await getAllCoinID();

        for (const wallet of allWallet) {
          try {
            isFetched = await wallet.fetchData();
          } catch (error) {
            console.error(error);
            isError = true;
            errorMessagesTemp.push(
              "Fetch error on " + wallet.displayName + ", Cause : " + (error as Error).message
            );
          }
        }
        if (isError) {
          setFetchStatus("fail");
          setErrorMessages(errorMessagesTemp);
        } else {
          setFetchStatus("success");
          if (isFetched) setAllWallet(getAllWallet());
        }
        isFetching.current = false;
      }
    }

    console.log("useEffect Fetch");
    fetchHandler();
    const intervalID = setInterval(fetchHandler, appSettings.intervalCheck);
    return () => {
      clearInterval(intervalID);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWallet]);

  let color = "";
  let tooltipLabel: JSX.Element;
  switch (fetchStatus) {
    case "fail":
      color = "red";
      tooltipLabel = (
        <Stack>
          {errorMessages.map((error, index) => (
            <Text key={index}>{error}</Text>
          ))}
        </Stack>
      );
      break;
    case "fetching":
      color = "yellow";
      tooltipLabel = <Text>Fetching Data...</Text>;
      break;
    case "success":
      color = "green";
      tooltipLabel = <Text>Data up to date</Text>;
      break;
    default:
      color = "grey";
      tooltipLabel = <Text>Inconnu</Text>;
      break;
  }
  //console.log("render indicator", fetchStatus);
  return (
    <Tooltip label={tooltipLabel}>
      <IconButton
        aria-label="Status"
        icon={<FontAwesomeIcon icon={faCircle} />}
        color={color}
      />
    </Tooltip>
  );
}
