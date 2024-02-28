"use server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import {
  AddressActivityWebhook,
  Alchemy,
  AlchemySettings,
  WebhookType,
} from "alchemy-sdk";
import { appSettings } from "../appSettings";
import { headers } from "next/headers";

export async function updateWebhookStatus({
  webhookIds,
  isActive,
}: {
  webhookIds: string[];
  isActive: boolean;
}) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const config: AlchemySettings = {
    authToken: process.env.ALCHEMY_AUTHTOKEN,
    //url: `/alchemynotify`,
  };
  const alchemy = new Alchemy(config);

  // Alchemy side
  for await (const webhookId of webhookIds) {
    await alchemy.notify.updateWebhook(webhookId, { isActive });
  }

  // database side
  return await db.user.update({
    where: { address: session.address },
    data: {
      notificationsEnable: isActive,
      webhooks: {
        updateMany: { where: { id: { in: webhookIds } }, data: { isActive } },
      },
    },
    include: {
      addressWallets: true,
      customWallets: true,
      groups: true,
      webhooks: true,
    },
  });
}

export type UpdatePayload = {
  [network in (typeof appSettings.chains)[number]["alchemyMainnet"]]: {
    create: {
      addresses: string[];
    } | null;
    delete: { webhookId: string } | null;
    update: {
      webhookId: string;
      addressesToAdd: string[];
      addressesToRemove: string[];
    } | null;
  };
};

export async function updateWebhooks(payload: UpdatePayload) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  const createdWebhooks: (AddressActivityWebhook & { addresses: string[] })[] =
    [];
  const deletedWebhookIds: string[] = [];
  const updatedWebhooks: NonNullable<
    UpdatePayload[keyof UpdatePayload]["update"]
  >[] = [];

  for await (const networkStr of Object.keys(payload)) {
    const network = networkStr as keyof UpdatePayload;
    const config: AlchemySettings = {
      authToken: process.env.ALCHEMY_AUTHTOKEN,
      network,
    };
    const alchemy = new Alchemy(config);

    // create
    if (payload[network].create) {
      // http://localhost can't be use ! error 400
      const webhookUrl =
        (process.env.NODE_ENV === "production"
          ? headers().get("origin")
          : "https://localtest.ioulos.com") + "/api/alchemyHook";

      const result = await alchemy.notify.createWebhook(
        webhookUrl,
        WebhookType.ADDRESS_ACTIVITY,
        {
          addresses: payload[network].create!.addresses,
          //network: network,
        }
      );
      createdWebhooks.push({
        ...result,
        addresses: payload[network].create!.addresses,
      });
    }
    // Delete
    if (payload[network].delete) {
      const webhookId = payload[network].delete!.webhookId;
      await alchemy.notify.deleteWebhook(webhookId);
      deletedWebhookIds.push(webhookId);
    }
    //Update
    if (payload[network].update) {
      const webhookId = payload[network].update!.webhookId;
      const addressesToAdd = payload[network].update!.addressesToAdd;
      const addressesToRemove = payload[network].update!.addressesToRemove;

      await alchemy.notify.updateWebhook(webhookId, {
        addAddresses: addressesToAdd,
        removeAddresses: addressesToRemove,
      });
      updatedWebhooks.push(payload[network].update!);
    }
  }

  // database side
  for await (const webhook of createdWebhooks) {
    await db.webhook.create({
      data: { ...webhook, userAddress: session.address },
    });
  }

  for await (const id of deletedWebhookIds) {
    await db.webhook.delete({ where: { id } });
  }
  for await (const webhook of updatedWebhooks) {
    const currentWebhook = (await db.webhook.findUnique({
      where: { id: webhook.webhookId },
    }))!;

    const updatedAddresses = currentWebhook.addresses.filter(
      (address) => !webhook.addressesToRemove.includes(address)
    );
    updatedAddresses.push(...webhook.addressesToAdd);

    await db.webhook.update({
      where: { id: webhook.webhookId },
      data: { addresses: updatedAddresses },
    });
  }

  // return updaded usez
  return await db.user.findUnique({
    where: { address: session.address },
    include: {
      addressWallets: true,
      customWallets: true,
      groups: true,
      webhooks: true,
    },
  });
}
