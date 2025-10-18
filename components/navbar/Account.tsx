import { getUserData } from "@/app/actions/user";
import useSession from "@/hooks/useSession";
import { displayName } from "@/lib/utils";
import {
  Avatar,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Button,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function Account() {
  const { logout } = useSession();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  const queryClient = useQueryClient();
  // When this mutation succeeds, invalidate any queries with the `user` or `addressWallets` query key
  const mutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
    },
  });
  if (!user) return null;

  return (
    <Popover placement={"bottom-end"}>
      <PopoverTrigger>
        <Button variant={"link"}>
          <Avatar size={"sm"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent width={"200px"}>
        <PopoverHeader>
          <Text fontSize={"sm"}>{displayName(user.address, null)}</Text>
        </PopoverHeader>
        <PopoverBody>
          <Button size={"xs"} onClick={() => mutation.mutate()}>
            Logout
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
