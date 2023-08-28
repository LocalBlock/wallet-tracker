import { promises as fs } from "fs";
import { coingecko } from "./Coingecko.js";
import path from "path";

export class NotificationdStorage {
  #delayWebhook = 3000;
  constructor(io, file, data) {
    this.currentStoreNotifications = data;
    this.io = io;
    this.notificationsPath = file;
    this.incomingNotifications = [];
    this.timeout = undefined;
  }
  static async init(io, file) {
    try {
      await fs.access(file);
    } catch (error) {
      // Create directory if not exist
      await fs.mkdir(path.dirname(file), { recursive: true });
      //File not exist create one
      await fs.writeFile(file, "[]");
    }
    try {
      const data = await fs.readFile(file, {
        encoding: "utf8",
      });
      return new NotificationdStorage(io, file, JSON.parse(data));
    } catch (error) {
      console.log(error);
    }
  }
  /**
   * Entry for new notification
   * @param {*} data
   */
  async newNotification(data) {
    //Start timer in order to receive all webhooks
    this.#setTimer(this.timeout);
    // Add alchemy notification to stack
    this.incomingNotifications = [...this.incomingNotifications, data];
  }

  #setTimer(timeout) {
    if (timeout) {
      //clear old timeout
      clearTimeout(timeout);
    }
    //setup a new timeout
    this.timeout = setTimeout(
      this.#sendIncomingNotification.bind(this),
      this.#delayWebhook
    );
  }
  /**
   * Send/save/ignore incoming notifications
   */
  async #sendIncomingNotification() {
    const notifications = await this.#parseIncomingNotifications();
    for await (const notif of notifications) {
      if (
        notif.assetSent.length === 0 &&
        notif.assetReceived.length === 0 &&
        !notif.assetTransfert
      ) {
        console.log(
          "[Incoming Notification] : A notification is ignore because no activity was detected. (Approuve transaction?)"
        );
      } else {
        // Send notification or save if user not connected
        if (!this.#sendNotificationUser(notif.toUser, notif))
          await this.#saveNotification(notif);
        else console.log("[Incoming Notification] : Sent to " + notif.toUser);
      }
    }
    this.incomingNotifications = []; //Job done, flush incoming transactions
  }
  /**
   * Parse data from incoming notifications
   * @returns new notification format
   */
  async #parseIncomingNotifications() {
    //For DEBUG, Store all incoming notifications
    this.#logRawData(this.incomingNotifications);
    let transactions = [];
    // regroup all activity to transaction because we receive separatly internal,external,token
    this.incomingNotifications.forEach((notif) => {
      notif.event.activity.forEach((act) => {
        const findTx = transactions.find((tx) => tx.hash == act.hash);

        if (findTx) {
          transactions = transactions.map((tx) => {
            if (tx.hash === act.hash) tx.activity = [...tx.activity, act];
            return tx;
          });
        } else {
          transactions.push({
            hash: act.hash,
            webhookId: notif.webhookId,
            createdAt: notif.createdAt,
            type: notif.type,
            network: notif.event.network,
            activity: [act],
          });
        }
      });
    });
    // Add user destination and addresses from webhook
    for await (const [index, tx] of transactions.entries()) {
      //Find user in saved usersData
      let userSettings;
      const files = await fs.readdir("data/users");
      for await (const file of files) {
        //const fileName=path.parse("data/users/" + file).name
        const userData = JSON.parse(
          await fs.readFile(`data/users/${file}`, "utf8")
        );
        if (userData.webhooks.find((wh) => wh.id === tx.webhookId)) {
          userSettings = userData;
          break;
        }
      }
      if (userSettings) {
        const newData = {
          ...tx,
          ["toUser"]: userSettings.web3UserId,
          ["addresses"]: userSettings.webhooks
            .find((wh) => wh.id === tx.webhookId)
            .addresses.map((address) => address.toLowerCase()),
        };
        transactions[index] = newData;
      }
    }

    //Analyse transcations and build result
    const result = [];
    //console.log(transactions);
    for await (const tx of transactions) {
      //Analyse activity
      const assetSent = [];
      const assetReceived = [];
      let assetTransfert = undefined;
      for await (const act of tx.activity) {
        if (act.value != 0) {
          //ignore external with 0 value
          const coingeckoResult = await coingecko.getIdAndImage(
            tx.network,
            act.rawContract.address,
            act.asset
          );
          //Transfert between addresses of webhook
          if (
            tx.addresses.includes(act.fromAddress) &&
            tx.addresses.includes(act.toAddress)
          ) {
            assetTransfert = {
              fromAddress: act.fromAddress,
              toAddress: act.toAddress,
              value: act.value,
              asset: act.asset,
              contractAddress: act.rawContract.address,
              id: coingeckoResult.id,
              image: coingeckoResult.image,
            };
          } else {
            if (tx.addresses.includes(act.fromAddress)) {
              // send
              assetSent.push({
                fromAddress: act.fromAddress,
                toAddress: act.toAddress,
                value: act.value,
                asset: act.asset,
                contractAddress: act.rawContract.address,
                id: coingeckoResult.id,
                image: coingeckoResult.image,
              });
            }
            if (tx.addresses.includes(act.toAddress)) {
              // Received
              assetReceived.push({
                fromAddress: act.fromAddress,
                toAddress: act.toAddress,
                value: act.value,
                asset: act.asset,
                contractAddress: act.rawContract.address,
                id: coingeckoResult.id,
                image: coingeckoResult.image,
              });
            }
          }
        }
      }
      //built result
      result.push({
        hash: tx.hash,
        toUser: tx.toUser,
        webhookId: tx.webhookId,
        createdAt: tx.createdAt,
        type: tx.type,
        network: tx.network,
        assetSent: assetSent,
        assetReceived: assetReceived,
        assetTransfert: assetTransfert,
      });
    }
    return result;
  }

  async #saveNotification(data) {
    //Add in objet
    this.currentStoreNotifications = [...this.currentStoreNotifications, data];
    // Write file
    await fs.writeFile(
      this.notificationsPath,
      JSON.stringify(this.currentStoreNotifications)
    );
    console.log("[Incoming Notification] : Notification saved");
  }

  async sendPendingNotifications(userId) {
    // Get
    const pendingUserNotification = this.currentStoreNotifications.filter(
      (notif) => notif.toUser === userId
    );
    // Send
    for (const pendingNotification of pendingUserNotification) {
      this.#sendNotificationUser(userId, pendingNotification);
    }
    //clean object
    this.currentStoreNotifications = this.currentStoreNotifications.filter(
      (notif) => notif.toUser != userId
    );
    //Write file
    try {
      await fs.writeFile(
        this.notificationsPath,
        JSON.stringify(this.currentStoreNotifications)
      );
    } catch (error) {
      console.log(error);
    }
    console.log("[Pending Notifications] : Sent to " + userId);
  }

  #sendNotificationUser(userId, message) {
    let isEmit = false;
    // Fetch all connected sockets to find user and send message
    for (let [, socket] of this.io.of("/").sockets) {
      if (socket.web3UserId === userId) {
        socket.emit("notification", JSON.stringify(message));
        isEmit = true;
      }
    }
    return isEmit;
  }

  async #logRawData(notifications) {
    try {
      await fs.access("data/notifications/log.json");
    } catch (error) {
      //File not exist create one
      await fs.writeFile("data/notifications/log.json", "[]");
    }
    try {
      const log = JSON.parse(
        await fs.readFile("data/notifications/log.json", "utf8")
      );
      await fs.writeFile(
        "data/notifications/log.json",
        JSON.stringify([...log, ...notifications])
      );
    } catch (error) {
      console.log(error);
    }
  }
}
