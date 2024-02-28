import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import GroupCheckbox from "./GroupCheckbox";
import { displayName } from "@/lib/utils";
import { createGroup, getUserData } from "@/app/actions/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AddGroup() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupName, setGroupName] = useState("");
  
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });


  const queryClient = useQueryClient()

  const mutationGroup = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
    },
  })



  if (!user) return null;

  const wallets = [
    ...user.addressWallets.map((addressWallet) => {
      return {
        id: addressWallet.address,
        displayName: displayName(addressWallet.address,addressWallet.ens),
      };
    }),
    ...user.customWallets.map((customWallet) => {
      return {
        id: customWallet.id,
        displayName: customWallet.name,
      };
    }),
  ];

  const handleSubmit = async () => {
    console.log("submit", groupName, selectedWallets);
    await mutationGroup.mutateAsync({name:groupName,walletIds:selectedWallets})
   // await createGroup(groupName, selectedWallets);
    onClose(); // Close modal
    resetState();
    //refetch();
  };

  const resetState = () => {
    setGroupName("");
    setSelectedWallets([]);
  };

  let errorMessage = "errorMessage";
  const isValidGroupName = () => {
    const result = user.groups.find((group) => group.name === groupName);
    if (result) {
      errorMessage = "Groupe déjà existant";
      return false;
    }
    if (groupName.length < 3) {
      errorMessage = "Minimun 3 carac";
      return false;
    }
    return true;
  };

  return (
    <>
      <Button onClick={onOpen}>Add Group</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetState();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Addgroup</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
              <FormControl
                isInvalid={!isValidGroupName() && groupName.length >= 1}
              >
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  onChange={(e) => setGroupName(e.target.value)}
                  value={groupName}
                />
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
              </FormControl>
              <GroupCheckbox
                defaultValue={[]}
                wallets={wallets}
                onChangeCheckbox={setSelectedWallets}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              mr={3}
              onClick={() => {
                onClose();
                resetState();
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!isValidGroupName() || selectedWallets.length===0}
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
