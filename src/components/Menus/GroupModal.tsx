import {
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tooltip,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useContext, useState } from "react";
import { AllWalletContext } from "../../contexts/AllWalletContext";
import { UserSettingsContext } from "../../contexts/UserSettingsContext";
import { updateUserSettings } from "../../functions/localstorage";
import { getUserSettings } from "../../functions/localstorage";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ServerStatusContext } from "../../contexts/ServerStatusContext";

interface GroupModalProps {
  action: "Edit" | "Add";
  children?: string;
  groupNameEdit: string;
}

export default function GroupModal({
  children,
  action,
  groupNameEdit,
}: GroupModalProps) {
  const { userSettings, setUserSettings } = useContext(UserSettingsContext);
  const { allWallet } = useContext(AllWalletContext);
  const { serverStatus } = useContext(ServerStatusContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupName, setGroupName] = useState(
    groupNameEdit ? groupNameEdit : ""
  );
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    groupNameEdit
      ? userSettings.groups.filter(
          (element) => element.name === groupNameEdit
        )[0].wallets
      : []
  );

  const defaultValue =
    userSettings.groups.find((group) => group.name === groupNameEdit)
      ?.wallets || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //console.log(e);
    setGroupName(e.target.value);
  };

  /** return the button or menu item which trigger modal */
  const modalTrigger = (action: "Edit" | "Add") => {
    switch (action) {
      case "Add":
        return <Button onClick={onOpen}>{children}</Button>;

      case "Edit":
        return (
          <Tooltip label="Edit" openDelay={500}>
            <IconButton
              aria-label="edit"
              //colorScheme="blackAlpha"
              size={"sm"}
              icon={<FontAwesomeIcon icon={faEdit} />}
              onClick={() => {
                //onCloseMenu(); // Close Menu
                onOpen();
              }}
            />
          </Tooltip>
        );
    }
  };
  /** Update or Add group */
  const handleSubmit = () => {
    const isConnectedUser = serverStatus.connectedUser ? true : false;
    //Update on localstorage
    const lsGroups = userSettings.groups;
    const index = lsGroups.findIndex(
      (group) => group.name === groupName || group.name === groupNameEdit
    );
    if (index != -1) {
      //Update existing group and Rename
      lsGroups[index].name = groupName;
      lsGroups[index].wallets = selectedWallets;
    } else {
      //New group
      lsGroups.push({ name: groupName, wallets: selectedWallets });
    }
    updateUserSettings("groups", lsGroups, isConnectedUser);
    // Update state from localstorage
    setUserSettings(getUserSettings());
    onClose(); // Close modal
  };

  const onChangeCheckbox = (e: Array<string>) => {
    setSelectedWallets(e);
  };

  let errorMessage = "errorMessage";
  const isValidGroupName = () => {
    if (groupName === "") {
      errorMessage = "Vide";
      return false;
    } else {
      errorMessage = "Groupe déjà existant";
      switch (action) {
        case "Add":
          return !userSettings.groups.some(
            (element) => element.name === groupName
          );
        case "Edit": {
          return (
            !userSettings.groups.some(
              (element) => element.name === groupName
            ) || groupName === groupNameEdit
          );
        }
      }
    }
  };

  const isValidCheckbox = () => {
    return selectedWallets.length != 0;
  };

  return (
    <>
      {modalTrigger(action)}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          groupNameEdit ? setGroupName(groupNameEdit) : setGroupName(""); //Back to default value on close Modal
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {action} group{action === "Edit" ? " : " + groupNameEdit : ""}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
              <FormControl
                isInvalid={!isValidGroupName() && groupName.length > 1}
              >
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  onChange={handleInputChange}
                  value={groupName}
                />
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
              </FormControl>
              <FormControl as={"fieldset"}>
                <FormLabel as={"legend"}>Group&apos;s addresses</FormLabel>
                <CheckboxGroup
                  colorScheme="green"
                  onChange={onChangeCheckbox}
                  defaultValue={defaultValue}
                >
                  <Stack
                    spacing={0}
                    direction={["column", "row"]}
                    wrap={"wrap"}
                    columnGap={6}
                    rowGap={2}
                  >
                    {allWallet.map((wallet) => (
                      <Checkbox
                        id={wallet.id}
                        key={wallet.id}
                        value={wallet.id}
                      >
                        {wallet.displayName}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
                <FormHelperText>Select one or more addresses</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              isDisabled={!isValidGroupName() || !isValidCheckbox()}
              onClick={handleSubmit}
            >
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
