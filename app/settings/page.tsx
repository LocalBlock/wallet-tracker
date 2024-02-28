"use client";
import { Flex } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getUserData } from "../actions/user";
import NoUser from "@/components/NoUser";
import NotificationSettings from "@/components/NotificationSettings";
import BasicSettings from "@/components/BasicSettings";

export default function Settings() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  if (!user) return <NoUser />;

  return (
    <Flex maxWidth={"2xl"} direction={"column"} gap={6} mx={{base:"1",md:"auto"}}>
      <BasicSettings currency={user.currency} />
      <NotificationSettings
        allAddressWallet={user.addressWallets}
        isEnable={user.notificationsEnable}
        webhooks={user.webhooks}
      />
    </Flex>
  );
}
