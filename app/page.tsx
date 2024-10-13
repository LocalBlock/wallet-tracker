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
import { getCoinsData } from "./actions/coinData";
import { getUserAssets, getUserDefi } from "@/lib/assets";

export default function Home() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  const { data: coinsData } = useQuery({
    queryKey: ["coinsData"],
    queryFn: () => getCoinsData(),
  });

  if (!user) return <NoUser />;

  if (user.addressWallets.length + user.customWallets.length === 0)
    return <Alert status="warning">No wallet</Alert>;

  if (!coinsData)
    return <Alert status="error">Something wrong, no coinsData !</Alert>;

  // Process tokens and defi
  // Get all selectedWalletAdressIDs, can be addressWallet id(0x) and custowallet id(cm...)
  let selectedWalletAddresIds: string[] = [];
  if (user.selectedGroupId) {
    selectedWalletAddresIds = user.groups.find(
      (group) => group.id === user.selectedGroupId
    )!.walletIds;
  } else if (user.selectedWalletId) {
    selectedWalletAddresIds = [user.selectedWalletId];
  }

  // Get selected addressWallet and selected custom wallet
  const selectedAddressWallets = user.addressWallets.filter((AddressWallet) =>
    selectedWalletAddresIds.includes(AddressWallet.address)
  );
  const selectedCustomWallets = user.customWallets.filter((customWallet) =>
    selectedWalletAddresIds.includes(customWallet.id)
  );

  // Merge assets and defi between selected addresswallets and selected custom wallets
  // Add also coinData (Prices, image, symbol, etc..) to each asset
  const userAssets = getUserAssets(
    selectedAddressWallets,
    selectedCustomWallets,
    coinsData
  );
  const userDefi = getUserDefi(selectedAddressWallets, coinsData);

  return (
    <Flex
      maxWidth={"2xl"}
      mx={{ base: "1", md: "auto" }}
      direction={"column"}
      gap={2}
    >
      <ChartBalance
        userAssets={userAssets}
        userDefi={userDefi}
        selectedChains={user.selectedChains}
        currency={user.currency}
      />
      <Flex justifyContent={"space-between"}>
        <ChainSelector selectedChains={user.selectedChains} />
        <WalletSelector user={user} />
      </Flex>
      {userAssets.length != 0 && (
        <WalletCard
          allAssets={userAssets}
          selectedChains={user.selectedChains}
          currency={user.currency}
        />
      )}
      <Defi
        userDefi={userDefi}
        selectedChains={user.selectedChains}
        currency={user.currency}
      />
    </Flex>
  );
}
