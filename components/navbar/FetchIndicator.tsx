import { getExpiredCoinDataIds, updateCoinData } from "@/app/actions/coinData";
import { getDefi, getTokens } from "@/app/actions/asset";
import { getUserData } from "@/app/actions/user";
import { fetchTokensWallet } from "@/app/actions/wallet";
import { appSettings } from "@/app/appSettings";
import { getAllIds, isExpired } from "@/lib/utils";
import { IconButton, Spinner, Tooltip, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaCircle } from "react-icons/fa6";

export default function FetchIndicator() {
  const { data: user, refetch } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });
  const [forceUpdate, setForceUpdate] = useState(false);
  const [lastFetchBalance, setLastFetchBalance] = useState<Date | undefined>(
    user?.addressWallets.length != 0
      ? user?.addressWallets[0].lastfetch
      : undefined
  );
  const [lastFetchPrice, setLastFetchPrice] = useState<Date>();

  let selectedWalletAddresIds: string[] = [];
  if (user?.selectedGroupId) {
    selectedWalletAddresIds = user.groups.find(
      (group) => group.id === user.selectedGroupId
    )!.walletIds;
  } else if (user?.selectedWalletId) {
    selectedWalletAddresIds = [user.selectedWalletId];
  }

  // Fetcher
  const {
    fetchStatus,
    status,
    error,
    refetch: forceRefetch,
  } = useQuery({
    queryKey: ["fetcher"],
    queryFn: () => fetchHandler(),
    refetchInterval: appSettings.intervalCheck,
    refetchIntervalInBackground: true,
    staleTime: Infinity, //the data will never be considered stale
    enabled: user ? true : false,
  });

  const queryClient = useQueryClient();

  const mutationTokens = useMutation({
    mutationFn: getTokens,
    onSuccess: (data) => {
      queryClient.setQueryData(["tokens", selectedWalletAddresIds], data);
    },
  });
  const mutationDefi = useMutation({
    mutationFn: getDefi,
    onSuccess: (data) => {
      queryClient.setQueryData(["defi", selectedWalletAddresIds], data);
    },
  });

  if (!user) return null;

  if (forceUpdate && fetchStatus === "idle") forceRefetch();

  const fetchHandler = async () => {
    let allIds: string[] = [];
    let isTokenfetched = false;

    // AddressWallets
    for await (const addressWallet of user.addressWallets) {
      if (
        isExpired(addressWallet.lastfetch, appSettings.fetchDelayBalance) ||
        forceUpdate
      ) {
        console.log("[Fetch balance]", addressWallet.address);
        const { allIdsFetched } = await fetchTokensWallet(
          addressWallet.address
        );
        allIds.push(...allIdsFetched);
        isTokenfetched = true;
      } else {
        allIds.push(...getAllIds(addressWallet));
      }
    }

    // customWallets
    // Add all coinId from customWallets
    for (const customWallet of user.customWallets) {
      customWallet.coins.forEach((coin) => allIds.push(coin.coinDataId));
    }
    // Remove duplicate
    allIds = Array.from(new Set(allIds));

    // Fetch prices
    let coinIdsToFetch: string[] = [];
    if (forceUpdate) {
      coinIdsToFetch = allIds;
    } else {
      coinIdsToFetch = await getExpiredCoinDataIds(allIds);
    }

    if (coinIdsToFetch.length != 0 || isTokenfetched) {
      if (coinIdsToFetch.length != 0) {
        console.log("[Fetch Prices] ", coinIdsToFetch);
        await updateCoinData(coinIdsToFetch);
        setLastFetchPrice(new Date());
      }
      if (isTokenfetched) setLastFetchBalance(new Date());

      if (forceUpdate) setForceUpdate(false);

      //Mutate tokens
      await mutationTokens.mutateAsync(selectedWalletAddresIds);

      // Do mutate on defi if there is a least one addresswallet
      if (selectedWalletAddresIds.some((walletId) => walletId.startsWith("0x")))
        await mutationDefi.mutateAsync(selectedWalletAddresIds);
      // Refetch user
      refetch();
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
      color = "green";
      tooltipLabel = (
        <>
          <Text align={"center"}>Last fetch</Text>
          <Text>Balance :&nbsp;{lastFetchBalance?.toLocaleString()}</Text>
          <Text>Prices :&nbsp;{lastFetchPrice?.toLocaleString()}</Text>
          <Text>Click to force update</Text>
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
