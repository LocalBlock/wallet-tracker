import React, { useContext, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  useToast,
  useDisclosure,
  RadioGroup,
  Stack,
  Radio,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { resolveENS } from "../../functions/Alchemy";
import {
  getAllWallet,
  getUserSettings,
  updateUserSettings,
} from "../../functions/localstorage";
import { AllWalletContext } from "../../contexts/AllWalletContext";
import { UserSettingsContext } from "../../contexts/UserSettingsContext";
import { AddressWallet, CustomWallet, Web3Wallet } from "../../classes/Wallet";

interface Props {
  children: string;
  allWallet: (AddressWallet | CustomWallet | Web3Wallet)[];
}
export default function WalletModal({ children, allWallet }: Props) {
  const [walletType, setWalletType] = useState("addressWallet");
  const [inputAddress, setInputAddress] = useState("");
  const [inputName, setInputName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setIsLoadingText] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setAllWallet } = useContext(AllWalletContext);
  const { setUserSettings } = useContext(UserSettingsContext);
  const toast = useToast();

  const handleInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    switch (walletType) {
      case "addressWallet":
        setInputAddress(e.target.value);
        break;
      case "customWallet":
        setInputName(e.target.value);
        break;
    }
  };

  //Regex for ENS Name
  const ensRegex = new RegExp(/^(?!-)[A-Za-z0-9-]+([-.]{1}[a-z0-9]+)*\.eth$/);
  // Valid function address
  let errorMessage = "";
  const isValidAddress = () => {
    if (inputAddress === "") return true;
    else if (
      ethers.utils.isAddress(inputAddress) ||
      ensRegex.test(inputAddress)
    ) {
      const allWalletfilter = allWallet.filter(
        (wallet) =>
          wallet.type === "AddressWallet" || wallet.type === "Web3Wallet"
      ) as (AddressWallet | Web3Wallet)[];
      if (
        allWalletfilter
          .map((wallet) => [wallet.address, wallet.ens])
          .flat()
          .includes(inputAddress)
      ) {
        errorMessage = "Addresse existante";
        return false;
      } else return true;
    } else {
      errorMessage = "Address invalid";
      return false;
    }
  };
  const isValidName = () => {
    if (inputName === "") return true;
    if (inputName.length < 3) {
      errorMessage = "Min 3char";
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    switch (walletType) {
      case "addressWallet":
        {
          setIsLoading(true);
          let ens = "";
          let address = undefined;
          if (ensRegex.test(inputAddress)) {
            setIsLoadingText("Resovling ENS");
            ens = inputAddress;
            address = await resolveENS(ens);
            if (!address) {
              toast({
                title: "Error",
                position: "top",
                status: "error",
                description:
                  "ENS name does not have an underlying address. Please try again.",
                isClosable: true,
                //duration: 2000,
              });
              setIsLoading(false);
              throw "Ens resolving error";
            }
          } else {
            address = inputAddress;
          }

          const newAddressWallet = new AddressWallet(address, ens);
          // Add in localstorage
          newAddressWallet.addWallet();
          // Fetch new address
          setIsLoadingText("Fetching Balance");
          await newAddressWallet.fetchBalance(true);
          await newAddressWallet.fetchPrice()
          //Back to default value
          setIsLoading(false);
          setInputAddress("");
          onClose(); //Close modal
          setAllWallet(getAllWallet()); //SetState from component App and from context
          //First address? add selectedAdds
          if (allWallet.length === 0) {
            updateUserSettings("selectedWallet", { type: "wallet", index: 0 });
            setUserSettings(getUserSettings());
          }
          toast({
            position: "top",
            status: "success",
            description: "Address successfully added",
            isClosable: true,
            //duration: 2000,
          });
        }
        break;
      case "customWallet":
        {
          const newCustomWallet = new CustomWallet(inputName);
          newCustomWallet.addWallet();
          setInputName("");
          onClose(); //Close modal
          setAllWallet(getAllWallet()); //SetState from component App and from context
          toast({
            position: "top",
            status: "success",
            description: "Custom wallet added, please add tokens for tracking",
            isClosable: true,
            //duration: 2000,
          });
        }
        break;
    }
  };

  //console.log("Render: AddressModal");
  return (
    <Button onClick={onOpen}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setInputAddress("");
          setInputName("");
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <FormControl as="fieldset">
                <FormLabel as="legend">Wallet type</FormLabel>

                <RadioGroup onChange={setWalletType} value={walletType}>
                  <Stack direction="row">
                    <Radio value="addressWallet">Address</Radio>
                    <Radio value="customWallet">Custom Wallet</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              {/* AddressWallet */}
              <FormControl
                isInvalid={!isValidAddress()}
                hidden={walletType === "addressWallet" ? false : true}
              >
                <FormLabel>Address</FormLabel>
                <Input
                  type="text"
                  onChange={handleInputChange}
                  value={inputAddress}
                />
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
                {isValidAddress() && (
                  <FormHelperText>
                    Ethereum address (0x...) or ENS name (vitalik.eth)
                  </FormHelperText>
                )}
              </FormControl>
              {/* CustomWallet */}
              <FormControl
                isInvalid={!isValidName()}
                hidden={walletType === "customWallet" ? false : true}
              >
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  onChange={handleInputChange}
                  value={inputName}
                />
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
                {isValidName() && (
                  <FormHelperText>Wallet&apos;s name</FormHelperText>
                )}
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              isLoading={isLoading}
              loadingText={loadingText}
              isDisabled={!isValidAddress() || inputAddress === ""}
              onClick={handleSubmit}
              hidden={walletType === "addressWallet" ? false : true}
            >
              Add
            </Button>
            <Button
              isDisabled={!isValidName() || inputName === ""}
              onClick={handleSubmit}
              hidden={walletType === "customWallet" ? false : true}
            >
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Button>
  );
}
