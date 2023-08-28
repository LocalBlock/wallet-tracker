import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  IconButton,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext } from "react";
import {
  getAllWallet,
  getUserSettings,
  updateUserSettings,
} from "../../functions/localstorage";
import { UserSettingsContext } from "../../contexts/UserSettingsContext";
import { AllWalletContext } from "../../contexts/AllWalletContext";
import { AddressWallet, Web3Wallet } from "../../classes/Wallet";
import { addAndRemoveAddresses, deleteWebhook } from "../../functions/Alchemy";
import { socket } from "../../socket";

interface ModalRemoveProps {
  alertHeader: string;
  alertBody: string;
  groupName?: string;
  walletId?: string;
}
export default function ModalRemove({
  alertHeader,
  alertBody,
  groupName = "",
  walletId = "",
}: ModalRemoveProps) {
  const cancelRef = React.useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { userSettings, setUserSettings } = useContext(UserSettingsContext);
  const { allWallet, setAllWallet } = useContext(AllWalletContext);

  const handleRemove = async () => {
    const lsGroups = userSettings.groups;
    // Remove group
    if (groupName) {
      //Update on localstorage
      const newData = lsGroups.filter((element) => element.name != groupName);
      updateUserSettings("groups", newData, false);
      //Update selectedAddress
      if (
        userSettings.selectedWallet.type === "group" &&
        lsGroups[userSettings.selectedWallet.index].name === groupName
      ) {
        //Group supprimé etait selctionné
        updateUserSettings(
          "selectedWallet",
          { type: "wallet", index: 0 },
          false
        ); //Première addresse par defaut
      }
    }
    //remove wallet
    if (walletId) {
      //First, remove wallet on groups
      lsGroups.map((group) => {
        const index = group.wallets.indexOf(walletId);
        if (index != -1) group.wallets.splice(index, 1); // 2nd parameter means remove one item only
      });
      // Remove group if there is no more wallet
      const index = lsGroups.findIndex((group) => group.wallets.length === 0);
      if (index != -1) {
        lsGroups.splice(index, 1);
        if (
          userSettings.selectedWallet.type === "group" &&
          userSettings.selectedWallet.index === index
        ) {
          updateUserSettings(
            "selectedWallet",
            { type: "wallet", index: 0 },
            false
          ); // Switch to first wallet if selected group is remove
        }
      }
      const removeWalletIndex = allWallet.findIndex(
        (wallet) => wallet.id === walletId
      );

      // if selected address is remove
      if (
        userSettings.selectedWallet.type === "wallet" &&
        userSettings.selectedWallet.index === removeWalletIndex
      ) {
        // back to first wallet
        updateUserSettings(
          "selectedWallet",
          { type: "wallet", index: 0 },
          false
        );
      } else if (userSettings.selectedWallet.index > removeWalletIndex) {
        // decrecment selected index if necessary
        updateUserSettings(
          "selectedWallet",
          {
            type: "wallet",
            index: --userSettings.selectedWallet.index,
          },
          false
        );
      }

      //Remove notifications webhook
      const walletToRemove = allWallet[removeWalletIndex];
      if (
        walletToRemove instanceof AddressWallet ||
        walletToRemove instanceof Web3Wallet
      ) {
        const webhooksWithAddressToRemove = userSettings.webhooks.filter((wh) =>
          wh.addresses.includes(walletToRemove.address)
        );
        if (webhooksWithAddressToRemove.length != 0) {
          let newWebhooksUserSetting = userSettings.webhooks;
          for await (const webhook of webhooksWithAddressToRemove) {
            if (webhook.addresses.length === 1) {
              console.log(
                `[Webhooks] Delete webhook ${webhook.id} on ${webhook.network}`
              );
              //Delete webhook
              await deleteWebhook(webhook.id);
              // Save new congig
              newWebhooksUserSetting = newWebhooksUserSetting.filter(
                (wh) => wh.id != webhook.id
              );
            } else {
              console.log(
                `[Webhooks] Remove address ${walletToRemove.address} on ${webhook.id}:${webhook.network}`
              );
              //Remove adressse
              await addAndRemoveAddresses(
                webhook.id,
                [],
                [walletToRemove.address]
              );
              // Update localStorage
              const newWebhookConfig = {
                ...webhook,
                ["addresses"]: webhook.addresses.filter(
                  (address) => address != walletToRemove.address
                ),
              };
              newWebhooksUserSetting = newWebhooksUserSetting.map((wh) =>
                wh.id === webhook.id ? newWebhookConfig : wh
              );
            }
          }
          //Update local storage
          updateUserSettings("webhooks", newWebhooksUserSetting, false);
        }
      }

      allWallet[removeWalletIndex].removeWallet(); // Remove wallet on local storage
      updateUserSettings("groups", lsGroups, false); // Update userSettings on localstorage
      setAllWallet(getAllWallet()); // Set state allAddress with new data from localstorage
    }
    // Save to server
    const settingsUpdated = getUserSettings();
    socket.emit("saveUserSettings", settingsUpdated);
    console.log("[Server] userSettings saved");
    setUserSettings(settingsUpdated); // Set state userSettings with new data from localstorage
    onClose(); //Close modal
  };

  return (
    <>
      <Tooltip label="Remove" openDelay={500}>
        <IconButton
          aria-label="Remove"
          colorScheme="red"
          size={"sm"}
          icon={<FontAwesomeIcon icon={faTrash} />}
          onClick={() => {
            onOpen(); // Open Modal
          }}
        />
      </Tooltip>
      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>{alertHeader}</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>{alertBody}</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              No
            </Button>

            <Button colorScheme="red" ml={3} onClick={handleRemove}>
              Yes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
