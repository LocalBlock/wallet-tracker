import { Image, useToast, Flex, Box, Link, Text } from "@chakra-ui/react";
import { Network, WebhookType } from "alchemy-sdk";
import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import { formatBalanceToken } from "../functions/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

interface Props {
  socket: Socket;
}

type assetNotification = {
  fromAddress: string;
  toAddress: string;
  value: number;
  asset: string;
  contractAddress?: string;
  id?: string;
  image?: string;
};

type notifications = {
  hash: string;
  toUser: string;
  webhookId: string;
  createdAt: string;
  type: WebhookType;
  network: keyof typeof Network;
  assetSent: assetNotification[];
  assetReceived: assetNotification[];
  assetTransfert?: assetNotification;
};

function detectType(notif: notifications) {
  if (notif.assetTransfert) return "transfert"; // Transfert between addresses's webhook
  if (notif.assetSent.length != 0 && notif.assetReceived.length != 0)
    return "exchange"; //Send asset and receive asset (Swap, deposit/witdraw on aave/beefy)
  if (notif.assetSent.length != 0) return "send"; // Send asset to another address (not in weekhook setting)
  if (notif.assetReceived.length != 0) return "receive"; // Receive asset from another address (not in weekhook setting)
}

function trimAddress(address: string) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function AssetsFormated({ assets }: { assets: assetNotification[] }) {
  const assetFormated = assets.map((asset) => {
    const image = asset.image ? (
      <>
        <Image
          align={"center"}
          boxSize={"25px"}
          src={asset.image}
          alt={asset.asset}
        />
        &nbsp;
      </>
    ) : null;
    return (
      <Flex key={asset.asset}>
        {image}
        <b>{formatBalanceToken(asset.value, asset.asset)}</b>
      </Flex>
    );
  });
  return <>{...assetFormated}</>;
}

function explorerUrl(
  network: notifications["network"],
  hash: notifications["hash"]
) {
  let baseUrl = "";
  switch (network) {
    case "ETH_MAINNET":
      baseUrl = "https://etherscan.io/tx/";
      break;
    case "ETH_GOERLI":
      baseUrl = "https://goerli.etherscan.io/tx/";
      break;
    case "MATIC_MAINNET":
      baseUrl = "https://polygonscan.com/tx/";
      break;
    case "MATIC_MUMBAI":
      baseUrl = "https://mumbai.polygonscan.com/tx/";
      break;
    default:
      break;
  }
  return baseUrl + hash;
}

async function buildToast(notif: notifications) {
  let toastProps;
  switch (detectType(notif)) {
    case "transfert":
      {
        const asset = notif.assetTransfert as assetNotification;
        toastProps = {
          title: "Activity between your wallets",
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"}>
                Transfert&nbsp;
                <Box>
                  <AssetsFormated assets={[asset]} />
                </Box>
                &nbsp;from {trimAddress(asset.fromAddress)} to{" "}
                {trimAddress(asset.toAddress)}{" "}
              </Flex>
              <Link isExternal href={explorerUrl(notif.network, notif.hash)}>
                Details&nbsp;
                <FontAwesomeIcon size={"xs"} icon={faUpRightFromSquare} />
              </Link>
            </>
          ),
        };
      }
      break;
    case "exchange":
      {
        toastProps = {
          title: "Activity on " + trimAddress(notif.assetSent[0].fromAddress),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"}>
                Sent&nbsp;
                <Box>
                  <AssetsFormated assets={notif.assetSent} />
                </Box>
                &nbsp;and received&nbsp;
                <Box>
                  <AssetsFormated assets={notif.assetReceived} />
                </Box>
              </Flex>
              <Link isExternal href={explorerUrl(notif.network, notif.hash)}>
                Details&nbsp;
                <FontAwesomeIcon size={"xs"} icon={faUpRightFromSquare} />
              </Link>
            </>
          ),
        };
      }
      break;
    case "send":
      {
        toastProps = {
          title: "Activity on " + trimAddress(notif.assetSent[0].fromAddress),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"}>
                Sent&nbsp;
                <Box>
                  <AssetsFormated assets={notif.assetSent} />
                </Box>
                &nbsp;
                {notif.assetSent.map((asset) => (
                  <Box key={asset.asset}>to {trimAddress(asset.toAddress)}</Box>
                ))}
              </Flex>
              <Link isExternal href={explorerUrl(notif.network, notif.hash)}>
                Details&nbsp;
                <FontAwesomeIcon size={"xs"} icon={faUpRightFromSquare} />
              </Link>
            </>
          ),
        };
      }
      break;
    case "receive":
      {
        toastProps = {
          title: "Activity on " + trimAddress(notif.assetReceived[0].toAddress),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"}>
                Received&nbsp;
                <Box>
                  <AssetsFormated assets={notif.assetReceived} />
                </Box>
                &nbsp;
                {notif.assetReceived.map((asset) => (
                  <Box key={asset.asset}>
                    from {trimAddress(asset.fromAddress)}
                  </Box>
                ))}
              </Flex>
              <Link isExternal href={explorerUrl(notif.network, notif.hash)}>
                Details&nbsp;
                <FontAwesomeIcon size={"xs"} icon={faUpRightFromSquare} />
              </Link>
            </>
          ),
        };
      }
      break;
    default:
      toastProps = {
        title: "Oups",
        status: "error" as const,
        description: (
          <>
            <Text>Unexpected type of notification</Text>
            <Link isExternal href={explorerUrl(notif.network, notif.hash)}>
              Details&nbsp;
              <FontAwesomeIcon size={"xs"} icon={faUpRightFromSquare} />
            </Link>
          </>
        ),
      };
      break;
  }
  return toastProps;
}

export default function AchemyNotifications({ socket }: Props) {
  const toast = useToast();

  async function onNotification(value: string) {
    const notif = JSON.parse(value) as notifications;
    const { title, status, description } = await buildToast(notif);
    //console.log(notif);
    toast({
      title: title,
      description: description,
      status: status,
      position: "top",
      duration: null,
      isClosable: true,
    });
  }

  useEffect(() => {
    console.log("useEffect Notification");
    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return null;
}
