import { addAddressWallet, addCustomWallet } from "@/app/actions/wallet";
import { fetchEnsAddress } from "@/lib/alchemy";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { AddressWallet } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { isAddress } from "viem";

type Props = {
  currentAddressWallet: AddressWallet[];
};

export default function AddWallet({ currentAddressWallet }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletType, setWalletType] = useState("addressWallet");
  const [inputAddress, setInputAddress] = useState("");
  const [inputName, setInputName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setIsLoadingText] = useState("");
  const toast = useToast();

  const queryClient = useQueryClient();

  // When this mutation succeeds, invalidate any queries with the `user` or `addressWallets` query key
  const mutationAddAddressWallet = useMutation({
    mutationFn: addAddressWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
    onError: (error, variable) => {
      toast({ title: error.name, description: error.message });
    },
  });

  const mutationCustomWallet = useMutation({
    mutationFn: addCustomWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  let errorMessage = "";
  //Regex for ENS Name
  const ensRegex = new RegExp(/^(?!-)[A-Za-z0-9-]+([-.]{1}[a-z0-9]+)*\.eth$/);

  const isValidAddress = (address: string) => {
    if (address.length === 0) return true;

    if (isAddress(address)) {
      const isAddressExist = currentAddressWallet.find(
        (wallet) => wallet.address === inputAddress
      )
        ? true
        : false;
      if (isAddressExist) {
        errorMessage = "Adresse exist";
        return false;
      }
      return true;
    }
    if (ensRegex.test(address)) return true;

    errorMessage = "Invalid Address";
    return false;
  };
  const isValidName = (name: string) => {
    if (name.length === 0) return true;
    if (name.length < 3) {
      errorMessage = "Min 3char";
      return false;
    }
    return true;
  };

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

  const handleSubmit = async (type: "addressWallet" | "customWallet") => {
    switch (type) {
      case "addressWallet":
        setIsLoading(true);
        if (ensRegex.test(inputAddress)) {
          setIsLoadingText("Resovling ENS");
          const resolvedAddress = await fetchEnsAddress(inputAddress);
          if (!resolvedAddress) {
            toast({
              title: "Error",
              position: "top",
              status: "error",
              description:
                "ENS name does not have an underlying address. Please try again.",
              isClosable: true,
            });
            setIsLoading(false);
          } else {
            // Add Wallet with ens and fetch
            setIsLoadingText("Fetch balance");
            await mutationAddAddressWallet.mutateAsync({
              address: resolvedAddress,
              ens: inputAddress,
            });
            // Reset states
            setIsLoading(false);
            setInputAddress("");
            // Close Modal
            onClose();
          }
        } else {
          // Add Wallet without ENS and fetch
          setIsLoadingText("Fetch balance");
          await mutationAddAddressWallet.mutateAsync({
            address: inputAddress,
            ens: null,
          });
          // Reset states
          setIsLoading(false);
          setInputAddress("");
          // Close Modal
          onClose();
        }
        break;
      case "customWallet":
        await mutationCustomWallet.mutateAsync(inputName);
        // Reset states
        setIsLoading(false);
        setInputName("");
        // Close Modal
        onClose();
      default:
        break;
    }
  };

  return (
    <>
      <Button onClick={onOpen}>Add wallet</Button>
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
          <ModalHeader>Add wallet</ModalHeader>
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
                isInvalid={!isValidAddress(inputAddress)}
                hidden={walletType === "addressWallet" ? false : true}
              >
                <FormLabel>Address</FormLabel>
                <Input
                  type="text"
                  onChange={handleInputChange}
                  value={inputAddress}
                />
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
                {isValidAddress(inputAddress) && (
                  <FormHelperText>
                    Ethereum address (0x...) or ENS name (vitalik.eth)
                  </FormHelperText>
                )}
              </FormControl>
              {/* CustomWallet */}
              <FormControl
                isInvalid={!isValidName(inputName)}
                hidden={walletType === "customWallet" ? false : true}
              >
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  onChange={handleInputChange}
                  value={inputName}
                />
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
                {isValidName(inputName) && (
                  <FormHelperText>Wallet&apos;s name</FormHelperText>
                )}
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              isLoading={isLoading}
              loadingText={loadingText}
              isDisabled={!isValidAddress(inputAddress) || inputAddress === ""}
              onClick={() => handleSubmit("addressWallet")}
              hidden={walletType === "addressWallet" ? false : true}
              colorScheme="blue"
            >
              Add
            </Button>
            <Button
              isDisabled={!isValidName(inputName) || inputName === ""}
              onClick={() => handleSubmit("customWallet")}
              hidden={walletType === "customWallet" ? false : true}
              colorScheme="blue"
            >
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
