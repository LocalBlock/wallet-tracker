"use client";
import { getCoinsData } from "@/app/actions/coinData";
import { appSettings } from "@/app/appSettings";
import { SocketContext } from "@/contexts/SocketProvider";
import { displayName, formatBalanceToken } from "@/lib/utils";
import { Box, Flex, Image, Tag, useToast, Text, Link } from "@chakra-ui/react";
import { Notification } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { FaUpRightFromSquare } from "react-icons/fa6";

export default function Notifications() {
  const socket = useContext(SocketContext);
  const toast = useToast();

  const { data: coinsData } = useQuery({
    queryKey: ["coinsData"],
    queryFn: () => getCoinsData(),
    staleTime: 0, // Maybe a new Coindata has beeen creeted so , we can consider that the data is always Stale?
  });

  function onNotification(notif: Notification) {
    const title = (
      <>
        <span>Activity on</span>{" "}
        <Tag variant={notif.chainId}>
          {appSettings.chains.find((chain) => chain.id === notif.chainId)?.name}
        </Tag>
      </>
    );
    const r =
      notif.received.length != 0 ? (
        <Box>
          <Text>
            Received on {displayName(notif.received[0].toAddress, null)}
          </Text>
          {notif.received.map((r) => {
            const coindata = coinsData?.find((cd) => cd.id === r.coinDataId);
            return (
              <Flex key={r.asset}>
                {coindata ? (
                  <Image
                    align={"center"}
                    alt={r.asset}
                    src={coindata.image}
                    boxSize={"25px"}
                  />
                ) : null}
                &nbsp;
                <Text color={"green"} as={"b"}>
                  +{formatBalanceToken(r.value)}&nbsp;
                </Text>
                {coindata ? coindata?.symbol.toUpperCase() : r.asset}
              </Flex>
            );
          })}
        </Box>
      ) : null;
    const s =
      notif.sent.length != 0 ? (
        <Box>
          <Text>Sent from {displayName(notif.sent[0].fromAddress, null)}</Text>
          {notif.sent.map((s) => {
            const coindata = coinsData?.find((cd) => cd.id === s.coinDataId);
            return (
              <Flex key={s.asset}>
                {coindata ? (
                  <Image
                    align={"center"}
                    alt={s.asset}
                    src={coindata.image}
                    boxSize={"25px"}
                  />
                ) : null}
                &nbsp;
                <Text color={"red"} as={"b"}>
                  -{formatBalanceToken(s.value)}&nbsp;
                </Text>
                {coindata ? coindata?.symbol.toUpperCase() : s.asset}
              </Flex>
            );
          })}
        </Box>
      ) : null;
    const t =
      notif.transfer.length != 0 ? (
        <Box>
          <Text>
            Tranfert from {displayName(notif.transfer[0].fromAddress, null)} to{" "}
            {displayName(notif.transfer[0].toAddress, null)}
          </Text>
          {notif.sent.map((t) => {
            const coindata = coinsData?.find((cd) => cd.id === t.coinDataId);
            return (
              <Flex key={t.asset}>
                {coindata ? (
                  <Image
                    align={"center"}
                    alt={t.asset}
                    src={coindata.image}
                    boxSize={"25px"}
                  />
                ) : null}
                &nbsp;
                <Text as={"b"}>{formatBalanceToken(t.value)}&nbsp;</Text>
                {coindata ? coindata?.symbol.toUpperCase() : t.asset}
              </Flex>
            );
          })}
        </Box>
      ) : null;

    const description = (
      <Flex gap={1} direction={"column"}>
        {t}
        {s}
        {r}
        <Flex alignItems={"center"}>
          <Link
            isExternal
            href={
              appSettings.chains.find((ch) => ch.id === notif.chainId)
                ?.explorerUrl +
              "/tx/" +
              notif.hash
            }
          >
            Details&nbsp;
          </Link>
          <FaUpRightFromSquare />
        </Flex>
      </Flex>
    );
    toast({
      title: title,
      description: description,
      status: "success",
      position: "top",
      duration: null,
      isClosable: true,
    });
  }

  useEffect(() => {
    if (socket) {
      socket.on("notification", onNotification);
      return () => {
        socket.off("notification", onNotification);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return null;
}
