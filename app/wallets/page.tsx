"use client";
import {
  Box,
  Text,
  Flex,
  Tooltip,
  IconButton,
  Heading,
} from "@chakra-ui/react";
import AddWallet from "@/components/wallets/AddWallet";
import RemoveWallet from "@/components/wallets/RemoveWallet";
import { FaCopy, FaWallet, FaObjectGroup } from "react-icons/fa6";
import EditCustomWallet from "@/components/wallets/EditCustomWallet";
import AddGroup from "@/components/wallets/AddGroup";
import EditGroup from "@/components/wallets/EditGroup";
import RemoveGroup from "@/components/wallets/RemoveGroup";
import { displayName } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { getUserData } from "../actions/user";
import NoUser from "@/components/NoUser";

export default function Wallets() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  if (!user) return <NoUser />;

  return (
    <Box maxWidth={"xs"} margin={"auto"}>
      <Box borderWidth={"2px"} borderRadius={"20"} p={3} marginBottom={2}>
        <Flex
          justifyContent={"space-between"}
          alignItems={"center"}
          marginBottom={4}
        >
          <Flex alignItems={"center"} gap={2}>
            <FaWallet />
            <Heading fontSize={"lg"} as={"h3"}>
              Wallets ({user.addressWallets.length + user.customWallets.length})
            </Heading>
          </Flex>
          <AddWallet currentAddressWallet={user.addressWallets} />
        </Flex>
        <Flex gap={3} direction={"column"}>
          {user.addressWallets.map((wallet) => (
            <Flex
              key={wallet.address}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Text>{displayName(wallet.address,wallet.ens)}</Text>
              <Flex gap={2}>
                <Tooltip label="Copy" openDelay={500}>
                  <IconButton
                    aria-label="Copy"
                    size={"sm"}
                    icon={<FaCopy />}
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.address);
                    }}
                  />
                </Tooltip>
                <RemoveWallet walletId={wallet.address} type="AddressWallet" />
              </Flex>
            </Flex>
          ))}
          {user.customWallets.map((wallet) => (
            <Flex
              key={wallet.id}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Text>{wallet.name}</Text>
              <Flex gap={2}>
                <EditCustomWallet wallet={wallet} />
                <RemoveWallet walletId={wallet.id} type="CustomWallet" />
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Box>
      <Box borderWidth={"2px"} borderRadius={"20"} p={3}>
        <Flex
          justifyContent={"space-between"}
          alignItems={"center"}
          marginBottom={4}
        >
          <Flex alignItems={"center"} gap={2}>
            <FaObjectGroup />
            <Heading fontSize={"lg"} as={"h3"}>
              Groups ({user.groups.length})
            </Heading>
          </Flex>
          <AddGroup />
        </Flex>
        <Flex gap={3} direction={"column"}>
          {user.groups.map((group) => (
            <Flex key={group.id} justifyContent={"space-between"}>
              <Text>{group.name}</Text>
              <Flex gap={2}>
                <EditGroup groupId={group.id} />
                <RemoveGroup groupId={group.id} />
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
