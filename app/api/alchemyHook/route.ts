import { createCoinData, getCoinlist } from "@/app/actions/coinData";
import { appSettings } from "@/app/appSettings";
import { db } from "@/lib/db";
import { IncomingNotifications } from "@/types";
import { Notification } from "@prisma/client";
import { Network } from "alchemy-sdk";

let timer: NodeJS.Timeout;
let incomingNotifications: IncomingNotifications[] = [];

export async function POST(req: Request) {
  const date = new Date();
  console.log(
    "[" + date.toLocaleDateString() + " " + date.toLocaleTimeString() + "]",
    "Notification received!"
  );

  //notifications.newNotification(req.body);
  incomingNotifications.push(await req.json());

  // Clear previous timeout
  clearTimeout(timer);
  // Set new timeout
  timer = setTimeout(async () => {

    // Sen to socket
    await fetch("http://localhost:3000/api/socket/notifications", {
      method: "POST",
      body:JSON.stringify(await parseIncomingNotification(incomingNotifications))
    });

    // clear incomingNotifications
    incomingNotifications = [];
  }, 3000);

  // Must return a http 200 response to alchemy
  return new Response("ok", { status: 200 });
}

async function parseIncomingNotification(
  incomingNotifications: IncomingNotifications[]
) {
  // regroup all activity to transaction because we receive separatly internal,external,token
  // https://docs.alchemy.com/reference/notify-api-faq#why-are-address-activity-events-for-the-same-transaction-split-across-multiple-response
  const transactions = incomingNotifications.reduce((acc, currentValue) => {
    const index = acc.findIndex(
      (tx) => tx.event.activity[0].hash === currentValue.event.activity[0].hash
    );
    if (index != -1) {
      //There is another incoming notification within same transaction hash
      // Merge activity
      acc[index].event.activity.push(...currentValue.event.activity);
    } else {
      // It's a new transaction
      // in most case we have only one transaction, but theorically we can have many different transaction in the same block
      acc.push(currentValue);
    }

    return acc;
  }, [] as IncomingNotifications[]);

  
  //Analyse transactions and build result
  const result: Notification[] = [];
  const coinList = await getCoinlist();
  const coinsData= await db.coinData.findMany()
  for await (const tx of transactions) {
    // get user address
    const userWebhook = await db.webhook.findUnique({
      where: { id: tx.webhookId },
    });
    // get chain info
    const chain = appSettings.chains.find(
      (ch) => ch.alchemyMainnet === Network[tx.event.network]
    );

    if (!userWebhook || !chain) {
      // Received tx notification without user! not possible
      !userWebhook &&
        console.warn(`No user for this incoming Notification ${tx.webhookId}`);
      !chain &&
        console.warn(
          `No chain in for this incoming Notification ${tx.webhookId}`
        );
    } else {
      // Analyse each activity
      const addressesLowerCase=userWebhook.addresses.map(address=>address.toLowerCase())
      const parsedTransfer: PrismaJson.AssetNotifications = [];
      const parsedSent: PrismaJson.AssetNotifications = [];
      const parsedReceived: PrismaJson.AssetNotifications = [];
      for (const activity of tx.event.activity) {
        switch (activity.category) {
          case "erc1155":
          case "token":
            {
              const coinId = coinList.find(
                (cl) => cl.platforms[chain.id] === activity.rawContract.address
              )?.id;
              //Create CoinData if not exist in db
              if (coinId&&!coinsData.find(cd=>cd.id===coinId)) await createCoinData([coinId])

              const parsedActivity = {
                coinDataId: coinId,
                fromAddress: activity.fromAddress,
                toAddress: activity.toAddress,
                // Don't know how to manage array erc1155Metadata
                value:
                  activity.category === "erc1155"
                    ? parseInt(activity.erc1155Metadata[0].value, 16)
                    : activity.value,
                asset: activity.asset,
              };

              //Transfert between addresses of webhook
              if (
                addressesLowerCase.includes(activity.fromAddress) &&
                addressesLowerCase.includes(activity.toAddress)
              ) {
                parsedTransfer.push(parsedActivity);
              } else {
                // Send activity
                if (addressesLowerCase.includes(activity.fromAddress)) {
                  parsedSent.push(parsedActivity);
                }
                // Received Activity
                if (addressesLowerCase.includes(activity.toAddress)) {
                  parsedReceived.push(parsedActivity);
                }
              }
            }

            break;

          // External is approuve, contract interaction an natvive token transfert?
          case "external": {
            if (activity.value != 0) {
              const parsedActivity = {
                coinDataId: chain.tokenId,
                fromAddress: activity.fromAddress,
                toAddress: activity.toAddress,
                value: activity.value,
                asset: activity.asset,
              };
              //Transfert between addresses of webhook
              if (
                addressesLowerCase.includes(activity.fromAddress) &&
                addressesLowerCase.includes(activity.toAddress)
              ) {
                parsedTransfer.push(parsedActivity);
              } else {
                // Send activity
                if (addressesLowerCase.includes(activity.fromAddress)) {
                  parsedSent.push(parsedActivity);
                }
                // Received Activity
                if (addressesLowerCase.includes(activity.toAddress)) {
                  parsedReceived.push(parsedActivity);
                }
              }
            } else {
              // Probably just interaction contract
            }
          }
          case "internal":
            // Don't known what to do...
            break;
          default:
            console.warn("unknown category");
            break;
        }
      }
      result.push({
        id: tx.id,
        createdAt: tx.createdAt,
        type: tx.type,
        chainId: chain.id,
        userAddress: userWebhook.userAddress,
        isSent: false,
        hash: tx.event.activity[0].hash,
        transfer: parsedTransfer,
        sent: parsedSent,
        received: parsedReceived,
      });
    }
  }
  return result;
}
