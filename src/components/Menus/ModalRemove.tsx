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
  const {allWallet, setAllWallet } = useContext(AllWalletContext);

  const handleRemove = () => {
    const lsGroups = userSettings.groups;
    // Remove group
    if (groupName) {
      //Update on localstorage
      const newData = lsGroups.filter((element) => element.name != groupName);
      updateUserSettings("groups", newData);
      //Update selectedAddress
      if (
        userSettings.selectedWallet.type === "group" &&
        lsGroups[userSettings.selectedWallet.index].name === groupName
      ) {
        //Group supprimé etait selctionné
        updateUserSettings("selectedWallet", { type: "wallet", index: 0 }); //Première addresse par defaut
      }
      setUserSettings(getUserSettings());
      onClose(); //Close modal
    }
    //remove Address
    if (walletId) {
      //First, remove Address on groups
      lsGroups.map((group) => {
        const index = group.wallets.indexOf(walletId);
        if (index != -1) group.wallets.splice(index, 1); // 2nd parameter means remove one item only
      });
      // Remove group if there is no more address
      const index = lsGroups.findIndex((group) => group.wallets.length === 0);
      if (index != -1) {
        lsGroups.splice(index, 1);
        if (
          userSettings.selectedWallet.type === "group" &&
          userSettings.selectedWallet.index === index
        ) {
          updateUserSettings("selectedWallet", { type: "wallet", index: 0 }); //Permière addresse par defaut
        }
      }
      allWallet.find(wallet=>wallet.id===walletId)?.removeWallet() // Remove wallet on local storage
      updateUserSettings("groups", lsGroups); // Update userSettings on  localstorage
      setUserSettings(getUserSettings()); // Set state userSettings with new data from localstorage
      setAllWallet(getAllWallet()); // Set state allAddress with new data from localstorage
      onClose(); //Close Modal
    }
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
