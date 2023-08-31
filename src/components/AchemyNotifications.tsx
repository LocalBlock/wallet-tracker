import { Image, useToast, Flex, Box, Link, Text, Tag } from "@chakra-ui/react";
import { Network, WebhookType } from "alchemy-sdk";
import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import { formatBalanceToken } from "../functions/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { appSettings } from "../settings/appSettings";

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
  assetTransfert: assetNotification[];
  erc1155Sent: (assetNotification & { tokenId: number })[];
  erc1155Received: (assetNotification & { tokenId: number })[];
  erc1155ransfert: (assetNotification & { tokenId: number })[];
};

function detectType(notif: notifications) {
  if (notif.assetTransfert.length != 0) return "transfert"; // Transfert between addresses's webhook
  if (notif.assetSent.length != 0 && notif.assetReceived.length != 0)
    return "exchange"; //Send asset and receive asset (Swap, deposit/witdraw on aave/beefy)
  if (notif.assetSent.length != 0) return "send"; // Send asset to another address (not in weekhook setting)
  if (notif.assetReceived.length != 0) return "receive"; // Receive asset from another address (not in weekhook setting)

  if (notif.erc1155ransfert.length != 0) return "erc1155transfert"; // Transfert between addresses's webhook
  if (notif.erc1155Sent.length != 0 && notif.erc1155Received.length != 0)
    return "erc1155exchange"; //Send asset and receive asset (Swap, deposit/witdraw on aave/beefy)
  if (notif.erc1155Sent.length != 0) return "erc1155send"; // Send asset to another address (not in weekhook setting)
  if (notif.erc1155Received.length != 0) return "erc1155receive"; // Receive asset from another address (not in weekhook setting)
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

function Erc1155Formated({
  assets,
}: {
  assets: (assetNotification & { tokenId: number })[];
}) {
  const erc1155Formated = assets.map((asset) => {
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
        for&nbsp;<b>{asset.value}</b>&nbsp;of Token ID{" "}
        {"[" + asset.tokenId + "] (" + asset.asset + ")"}
      </Flex>
    );
  });
  return <>{...erc1155Formated}</>;
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
  const networkTag = (
    <Tag
      variant={
        appSettings.chains.find(
          (chain) =>
            chain.alchemyMainnet === Network[notif.network] ||
            chain.alchemyTestnet === Network[notif.network]
        )?.id
      }
    >
      {
        appSettings.chains.find(
          (chain) =>
            chain.alchemyMainnet === Network[notif.network] ||
            chain.alchemyTestnet === Network[notif.network]
        )?.name
      }
    </Tag>
  );

  switch (detectType(notif)) {
    case "transfert":
      {
        toastProps = {
          title: <>{networkTag} Activity between your wallets</>,
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Transfert</i>
                  </Box>
                  <AssetsFormated assets={notif.assetTransfert} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>From</i>
                  </Box>
                  {notif.assetTransfert.map((asset) => (
                    <Box key={asset.asset}>
                      {trimAddress(asset.fromAddress)}
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>To</i>
                  </Box>
                  {notif.assetTransfert.map((asset) => (
                    <Box key={asset.asset}>{trimAddress(asset.toAddress)}</Box>
                  ))}
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
    case "exchange":
      {
        toastProps = {
          title: (
            <>
              {networkTag} Activity on{" "}
              {trimAddress(notif.assetSent[0].fromAddress)}
            </>
          ),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Sent</i>
                  </Box>
                  <AssetsFormated assets={notif.assetSent} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Received</i>
                  </Box>
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
          title: (
            <>
              {networkTag} Activity on{" "}
              {trimAddress(notif.assetSent[0].fromAddress)}
            </>
          ),

          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Sent</i>
                  </Box>
                  <AssetsFormated assets={notif.assetSent} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>To</i>
                  </Box>
                  {notif.assetSent.map((asset) => (
                    <Box key={asset.asset}>{trimAddress(asset.toAddress)}</Box>
                  ))}
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
    case "receive":
      {
        toastProps = {
          title: (
            <>
              {networkTag} Activity on{" "}
              {trimAddress(notif.assetReceived[0].toAddress)}
            </>
          ),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Received</i>
                  </Box>
                  <AssetsFormated assets={notif.assetReceived} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>From</i>
                  </Box>
                  {notif.assetReceived.map((asset) => (
                    <Box key={asset.asset}>
                      {trimAddress(asset.fromAddress)}
                    </Box>
                  ))}
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

    case "erc1155transfert":
      {
        toastProps = {
          title: <>{networkTag} ERC-1155 activity between your wallets</>,
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Transfert</i>
                  </Box>
                  <Erc1155Formated assets={notif.erc1155ransfert} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>from</i>
                  </Box>
                  {notif.erc1155ransfert.map((transfert) => (
                    <Box key={transfert.asset}>
                      {trimAddress(transfert.fromAddress)}
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>to</i>
                  </Box>
                  {notif.erc1155ransfert.map((transfert) => (
                    <Box key={transfert.asset}>
                      {trimAddress(transfert.toAddress)}
                    </Box>
                  ))}
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
    case "erc1155exchange":
      {
        toastProps = {
          title: (
            <>
              {networkTag} ERC-1155 activity on{" "}
              {trimAddress(notif.erc1155Sent[0].fromAddress)}
            </>
          ),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Sent</i>
                  </Box>
                  <Erc1155Formated assets={notif.erc1155Sent} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Received</i>
                  </Box>
                  <Erc1155Formated assets={notif.erc1155Received} />
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
    case "erc1155send":
      {
        toastProps = {
          title: (
            <>
              {networkTag} ERC-1155 activity on{" "}
              {trimAddress(notif.erc1155Sent[0].fromAddress)}
            </>
          ),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Sent</i>
                  </Box>
                  <Erc1155Formated assets={notif.erc1155Sent} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>To</i>
                  </Box>
                  {notif.erc1155Sent.map((asset) => (
                    <Box key={asset.tokenId}>
                      {trimAddress(asset.toAddress)}
                    </Box>
                  ))}
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
    case "erc1155receive":
      {
        toastProps = {
          title: (
            <>
              {networkTag} ERC-1155 activity on{" "}
              {trimAddress(notif.erc1155Received[0].toAddress)}
            </>
          ),
          status: "success" as const,
          description: (
            <>
              <Flex flexWrap={"wrap"} align={"center"} gap={2}>
                <Box>
                  <Box textAlign={"center"}>
                    <i>Received</i>
                  </Box>
                  <Erc1155Formated assets={notif.erc1155Received} />
                </Box>
                <Box>
                  <Box textAlign={"center"}>
                    <i>From</i>
                  </Box>
                  {notif.erc1155Received.map((asset) => (
                    <Box key={asset.tokenId}>
                      {trimAddress(asset.fromAddress)}
                    </Box>
                  ))}
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
