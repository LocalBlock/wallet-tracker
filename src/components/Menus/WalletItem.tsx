import React from "react";
import { AddressWallet, CustomWallet, Web3Wallet } from "../../classes/Wallet";
import { Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EditCustomWallet from "./EditCustomWallet";
import ModalRemove from "./ModalRemove";

interface Props {
  wallet: AddressWallet | CustomWallet | Web3Wallet;

}

export default function WalletItem({ wallet }: Props) {
  let actionButtons: JSX.Element;
  switch (wallet.type) {
    case "AddressWallet":
      {
        const walletTyped = wallet as AddressWallet;

        actionButtons = (
          <>
            <Tooltip label="Copy" openDelay={500}>
              <IconButton
                aria-label="Copy"
                size={"sm"}
                icon={<FontAwesomeIcon icon={faCopy} />}
                onClick={() => {
                  navigator.clipboard.writeText(walletTyped.address);
                }}
              />
            </Tooltip>
            <ModalRemove
              walletId={walletTyped.id}
              //onCloseMenu={onCloseMenu}
              alertHeader="Remove Address"
              alertBody={
                "Do you want to remove this wallet : " +
                walletTyped.address +
                " ?"
              }
            />
          </>
        );
      }
      break;
    case "CustomWallet":
      {
        const walletTyped = wallet as CustomWallet;
        actionButtons = (
          <>
            <EditCustomWallet
              walletId={wallet.id}
              //onCloseMenu={onCloseMenu}
            />

            <ModalRemove
              walletId={walletTyped.id}
              alertHeader="Remove Address"
              alertBody={
                "Do you want to remove this wallet : " +
                walletTyped.displayName +
                " ?"
              }
            />
          </>
        );
      }
      break;
    case "Web3Wallet":
      {
        const walletTyped = wallet as Web3Wallet;

        actionButtons = (
          <>
            <IconButton
              aria-label="Copy"
              size={"sm"}
              icon={<FontAwesomeIcon icon={faCopy} />}
              onClick={() => {
                navigator.clipboard.writeText(walletTyped.address);
              }}
            />

            <ModalRemove
              walletId={walletTyped.id}
              //onCloseMenu={onCloseMenu}
              alertHeader="Remove Address"
              alertBody={
                "Do you want to remove this wallet : " +
                walletTyped.address +
                " ?"
              }
            />
          </>
        );
      }
      break;
  }
  return (
    <Flex
      justifyContent={"space-between"}
      gap={5}
      alignItems={"center"}
    >
      {wallet.displayName}
      <Flex gap={1}>{actionButtons}</Flex>
    </Flex>
  );
}
