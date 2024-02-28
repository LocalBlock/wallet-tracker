"use client";
import { getUserData } from "@/app/actions/user";
import { useQuery } from "@tanstack/react-query";
import { Alert, Flex } from "@chakra-ui/react";
import WalletSelector from "@/components/WalletSelector";
import ChainSelector from "@/components/ChainSelector";
import NoUser from "@/components/NoUser";
import WalletCard from "@/components/cards/WalletCard";
import Defi from "@/components/Defi";
import ChartBalance from "@/components/ChartBalance";

export default function Home() {
  // This useQuery could just as well happen in some deeper
  // child to <Posts>, data will be available immediately either way
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  if (!user) return <NoUser />;

  if (user.addressWallets.length + user.customWallets.length === 0)
    return <Alert status="warning">No wallet</Alert>;

  let selectedWalletAddresIds: string[] = [];
  if (user.selectedGroupId) {
    selectedWalletAddresIds = user.groups.find(
      (group) => group.id === user.selectedGroupId
    )!.walletIds;
  } else if (user?.selectedWalletId) {
    selectedWalletAddresIds = [user.selectedWalletId];
  }

  return (
      <Flex maxWidth={"2xl"} mx={{base:"1",md:"auto"}} direction={"column"} gap={2} >
        <ChartBalance
          selectedWalletAddresIds={selectedWalletAddresIds}
          selectedChains={user.selectedChains}
          currency={user.currency}
        />
        <Flex justifyContent={"space-between"}>
          <ChainSelector selectedChains={user.selectedChains} />
          <WalletSelector user={user} />
        </Flex>
        <WalletCard
          selectedWalletAddresIds={selectedWalletAddresIds}
          selectedChains={user.selectedChains}
          currency={user.currency}
        />
        <Defi
          selectedWalletAddresIds={selectedWalletAddresIds}
          selectedChains={user.selectedChains}
          currency={user.currency}
        />
      </Flex>
  );
}
