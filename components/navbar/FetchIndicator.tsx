import { getCoinsData, updateCoinData } from "@/app/actions/coinData";
import { getUserData } from "@/app/actions/user";
import { updateAddressWallet } from "@/app/actions/wallet";
import { appSettings } from "@/app/appSettings";
import { getAllIds, isExpired } from "@/lib/utils";
import { IconButton, Spinner, Tooltip, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaCircle } from "react-icons/fa6";
import {
  fetchAaveBalance,
  fetchBalance,
  fetchBeefyVaults,
  fetchPrices,
} from "@/lib/fetchFunctions";

export default function FetchIndicator() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  const { data: coinsData, dataUpdatedAt } = useQuery({
    queryKey: ["coinsData"],
    queryFn: () => getCoinsData(),
  });

  const [forceUpdate, setForceUpdate] = useState(false);
  const [lastFetchBalance, setLastFetchBalance] = useState<Date | undefined>(
    user?.addressWallets.length != 0
      ? user?.addressWallets[0].lastfetch
      : undefined
  );
  const [lastFetchPrice, setLastFetchPrice] = useState<Date>(
    new Date(dataUpdatedAt)
  );

  // Fetcher
  const {
    fetchStatus,
    status,
    error,
    errorUpdateCount,
    errorUpdatedAt,
    refetch: forceRefetch,
  } = useQuery({
    queryKey: ["fetcher"],
    queryFn: () => fetchHandler(),
    refetchInterval: appSettings.intervalCheck,
    refetchIntervalInBackground: true,
    staleTime: Infinity, //the data will never be considered stale
    enabled: user ? true : false,
    retry: false, // No need to retry will be done on next interval
  });

  const queryClient = useQueryClient();

  const mutationAddressWallet = useMutation({
    mutationFn: updateAddressWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  const mutationCoinData = useMutation({
    mutationFn: updateCoinData,
    onSuccess: (data) => {
      queryClient.setQueryData(["coinsData"], data);
    },
  });

  if (!user) return null;

  if (forceUpdate && fetchStatus === "idle") forceRefetch();

  const fetchHandler = async () => {
    let allIds: string[] = [];
    let errorMessage: string | undefined = undefined;

    // AddressWallets
    for await (const addressWallet of user.addressWallets) {
      if (
        isExpired(addressWallet.lastfetch, appSettings.fetchDelayBalance) ||
        forceUpdate
      ) {
        console.log(`[Fetch address : ${addressWallet.address}]`);

        // BALANCE
        const { nativeTokens, tokens } = await fetchBalance(
          addressWallet.address
        );

        // AAVE
        let safetyModule:
          | Awaited<ReturnType<typeof fetchAaveBalance>>["safetyModule"]
          | undefined;
        let aavePools:
          | Awaited<ReturnType<typeof fetchAaveBalance>>["aavePools"]
          | undefined;
        try {
          ({ safetyModule, aavePools } = await fetchAaveBalance(
            addressWallet.address
          ));
        } catch (error: any) {
          safetyModule = undefined;
          aavePools = undefined;
          errorMessage = error.message;
        }

        // BEEFY
        // Get beeyVaults and mutate tokens
        let beefyUserVaults:
          | Awaited<ReturnType<typeof fetchBeefyVaults>>
          | undefined;
        try {
          beefyUserVaults = await fetchBeefyVaults(tokens);
        } catch (error: any) {
          errorMessage = errorMessage + "\n" + error.message;
        }

        // Final Step
        // Split tokens into 2 new array, identified/unidentified
        const identifiedTokens = [];
        const unIdentifiedTokens = [];
        for (const token of tokens) {
          if (token.coinDataId) {
            identifiedTokens.push({
              contractAddress: token.contractAddress,
              balance: token.balance,
              chain: token.chain,
              coinDataId: token.coinDataId,
            });
          } else {
            unIdentifiedTokens.push({
              contractAddress: token.contractAddress,
              balance: token.balance,
              chain: token.chain,
            });
          }
        }

        // mutate adresswallet
        const updatedAddressWallet = await mutationAddressWallet.mutateAsync({
          address: addressWallet.address,
          nativeTokens: nativeTokens,
          tokens: identifiedTokens,
          defi: {
            aaveSafetyModule:
              safetyModule ?? addressWallet.defi.aaveSafetyModule, // if Aave fetch fail, keep old data
            aaveV2: aavePools?.aaveV2 ?? addressWallet.defi.aaveV2, // if Aave fetch fail, keep old data
            aaveV3: aavePools?.aaveV3 ?? addressWallet.defi.aaveV3, // if Aave fetch fail, keep old data
            beefy: beefyUserVaults ?? addressWallet.defi.beefy, // if beefy fetch fail, keep old data
          },
        });

        //Push allId from updated adress wallet
        allIds.push(...getAllIds(updatedAddressWallet));
        setLastFetchBalance(new Date());
      } else {
        // Get allIds of current addressWallet
        allIds.push(...getAllIds(addressWallet));
      }
    }

    // CustomWallets
    // Add all coinId from customWallets
    for (const customWallet of user.customWallets) {
      customWallet.coins.forEach((coin) => allIds.push(coin.coinDataId));
    }
    // Remove duplicate id
    allIds = Array.from(new Set(allIds)); // This is allids

    // PRICES
    let coinIdsToFetch: string[] = [];
    if (forceUpdate) {
      // Fetch all Coins
      coinIdsToFetch = allIds;
    } else {
      // Fetch only expired coindata
      allIds.forEach((id) => {
        const coinDataFinded = coinsData?.find((cd) => cd.id === id);
        if (
          coinDataFinded &&
          isExpired(coinDataFinded.updatedAt, appSettings.fetchDelayPrices)
        )
          coinIdsToFetch.push(coinDataFinded.id);
      });
    }

    if (coinIdsToFetch.length != 0) {
      // Mutate coinData
      const { dataMarket, dataPrice } = await fetchPrices(coinIdsToFetch);

      await mutationCoinData.mutateAsync({
        coinIds: coinIdsToFetch,
        dataMarket,
        dataPrice,
      });

      setLastFetchPrice(new Date());

      if (forceUpdate) setForceUpdate(false);

      // Throw error for react query
      if (errorMessage) throw new Error(errorMessage);
    } else {
      console.log("No need to fetch");
    }
    return "je sais pas";
  };

  // Manage Status Display
  let color = "grey";
  let tooltipLabel: JSX.Element = <Text>Last fetch : Unknow</Text>;
  if (fetchStatus === "idle") {
    if (status === "error") {
      color = "red";
      tooltipLabel = <>{error.message}</>;
    }
    if (status === "success") {
      color = errorUpdateCount > 0 ? "yellow" : "green";
      tooltipLabel = (
        <>
          <Text align={"center"}>Last fetch</Text>
          <Text>Balance :&nbsp;{lastFetchBalance?.toLocaleString()}</Text>
          <Text>Prices :&nbsp;{lastFetchPrice?.toLocaleString()}</Text>
          <Text>Click to force update</Text>
          {errorUpdateCount > 0 ? (
            <Text color={"red"}>⚠️There was some fetching errors at {new Date(errorUpdatedAt).toLocaleTimeString()}</Text>
          ) : null}
        </>
      );
    }
  }
  if (fetchStatus === "fetching") {
    color = "yellow";
    tooltipLabel = <Text>Fetching Data...</Text>;
  }

  return (
    <Tooltip label={tooltipLabel}>
      <IconButton
        aria-label="Status"
        icon={fetchStatus === "fetching" ? <Spinner /> : <FaCircle />}
        color={color}
        onClick={() => setForceUpdate(true)}
      />
    </Tooltip>
  );
}
