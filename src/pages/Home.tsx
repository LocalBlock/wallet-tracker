import React, { useContext } from "react";
import { Container, VStack } from "@chakra-ui/react";
import CardBalance from "../components/CardBalance";
import ChainSelector from "../components/ChainSelector";
import AddressSelector from "../components/WalletSelector";
import { AllWalletContext } from "../contexts/AllWalletContext";

import { UserSettingsContext } from "../contexts/UserSettingsContext";
import CardAave from "../components/CardAave";
import CardBeefy from "../components/CardBeefy";
import ChartBalance from "../components/ChartBalance";
import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";

export default function Home() {
  const { allWallet } = useContext(AllWalletContext);
  const { userSettings } = useContext(UserSettingsContext);

  // Determine active address
  const allActiveWallet: (AddressWallet | CustomWallet | Web3Wallet)[] = [];
  switch (userSettings.selectedWallet.type) {
    case "wallet":
      allActiveWallet.push(allWallet[userSettings.selectedWallet.index]);
      break;
    case "group":
      {
        const addressesGroup =
          userSettings.groups[userSettings.selectedWallet.index].wallets;
        allActiveWallet.push(
          ...allWallet.filter((wallet) => addressesGroup.includes(wallet.id))
        );
      }
      break;
  }

  if (allActiveWallet.length === 0) {
    return null;
  }
  return (
    <Container maxWidth={"container.md"}>
      <ChartBalance
        allActiveWallet={allActiveWallet}
        selectedChain={userSettings.selectedChain}
        selectedCurrency={userSettings.currency}
      />
      <ChainSelector />
      <AddressSelector />
      <VStack align={"stretch"} spacing={8}>
        {/* Wallet */}
        <CardBalance
          allActiveWallet={allActiveWallet}
          selectedChain={userSettings.selectedChain}
          selectedCurrency={userSettings.currency}
        />
        {/* AaveV2 */}
        {userSettings.selectedChain.map((chain, index) => (
          <CardAave
            key={index}
            version="V2"
            allActiveWallet={allActiveWallet}
            chainId={chain}
            selectedCurrency={userSettings.currency}
          />
        ))}
        {/* AaveV3 */}
        {userSettings.selectedChain.map((chain, index) => (
          <CardAave
            key={index}
            version="V3"
            allActiveWallet={allActiveWallet}
            chainId={chain}
            selectedCurrency={userSettings.currency}
          />
        ))}
        {/* Beefy */}
        <CardBeefy
          allActiveWallet={allActiveWallet}
          selectedChain={userSettings.selectedChain}
          selectedCurrency={userSettings.currency}
        />
      </VStack>
    </Container>
  );
}
