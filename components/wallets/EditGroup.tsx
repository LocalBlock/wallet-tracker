import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tooltip,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import GroupCheckbox from "@/components/wallets/GroupCheckbox";
import { displayName } from "@/lib/utils";
import { getUserData, updateGroup } from "@/app/actions/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  groupId: string;
};

export default function EditGroup({ groupId }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  const queryClient = useQueryClient()
  const mutationGroup = useMutation({
    mutationFn: updateGroup,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
    },
  })

  const initialGroup = user!.groups.find((group) => group.id === groupId)!;
  const [groupName, setGroupName] = useState(initialGroup.name);
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    initialGroup.walletIds
  );

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

  const handleSubmit = async() => {
    mutationGroup.mutate({groupId:initialGroup.id,name:groupName,walletIds:selectedWallets})
    onClose(); // Close modal
  };

  const resetState = () => {
    setGroupName(initialGroup.name);
    setSelectedWallets(initialGroup.walletIds);
  };

  let errorMessage = "errorMessage";
  const isValidGroupName = () => {

    if (groupName.length < 3) {
      errorMessage = "Minimun 3 carac";
      return false;
    }
    return true;
  };

  return (
    <>
      <Tooltip label="Edit" openDelay={500}>
        <IconButton
          aria-label="edit"
          size={"sm"}
          icon={<FaEdit />}
          onClick={() => {
            onOpen();
          }}
        />
      </Tooltip>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetState();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
              <FormControl
                isInvalid={!isValidGroupName() && groupName.length >= 1}
              >
                <FormLabel>Name</FormLabel>

                <Editable defaultValue={groupName}>
                  <EditablePreview />
                  <EditableInput onChange={(e)=>setGroupName(e.target.value)}/>
                </Editable>
                <FormErrorMessage>{errorMessage}</FormErrorMessage>
              </FormControl>
              <GroupCheckbox
                defaultValue={initialGroup.walletIds}
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
              isDisabled={!isValidGroupName()}
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
