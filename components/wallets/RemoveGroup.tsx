import {
  Tooltip,
  IconButton,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { FaTrash } from "react-icons/fa";
import { useRef } from "react";
import { getUserData, removeGroup } from "@/app/actions/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  groupId: string;
};

export default function RemoveGroup({ groupId }: Props) {
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  const queryClient = useQueryClient()

  const mutationGroup = useMutation({
    mutationFn: removeGroup,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data)
    },
  })
  if (!user) return null;

  const group = user.groups.find((group) => group.id === groupId)!;
  const handleRemove = async () => {
    mutationGroup.mutate(groupId)
  };
  return (
    <>
      <Tooltip label="Edit" openDelay={500}>
        <IconButton
          aria-label="Remove"
          colorScheme="red"
          size={"sm"}
          icon={<FaTrash />}
          onClick={() => {
            onOpen();
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
          <AlertDialogHeader>Remove group ?</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            Do you want to remove the group : {group.name} ?
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
