import { getUserData } from "@/app/actions/user";
import { removeWallet } from "@/app/actions/wallet";
import { WalletType } from "@/types";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { FaTrash } from "react-icons/fa6";

interface Props {
  walletId: string;
  type: WalletType;
}

export default function RemoveWallet({ walletId, type }: Props) {
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  const queryClient = useQueryClient()

  const mutation= useMutation({
    mutationFn: removeWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
    },
  })
  if (!user) return null;

  const addressWalletToRemove = user.addressWallets.find(
    (wallet) => wallet.address === walletId
  );
  const customWalletToRemove = user.customWallets.find(
    (wallet) => wallet.id === walletId
  );


  const handleRemove = async () => {
    await mutation.mutateAsync({walletId,type})
  };

  return (
    <>
      <Tooltip label="Remove" openDelay={500}>
        <IconButton
          aria-label="Remove"
          colorScheme="red"
          size={"sm"}
          icon={<FaTrash />}
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
          <AlertDialogHeader>Remove Wallet</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            {type==="AddressWallet" &&
              "Do you want to remove this wallet : " +
                addressWalletToRemove?.address +
                " ?"}
            {type==="CustomWallet"&&
              "Do you want to remove this wallet : " +
                customWalletToRemove?.name +
                " ?"}
          </AlertDialogBody>
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
