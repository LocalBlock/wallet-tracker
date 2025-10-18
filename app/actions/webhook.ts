"use server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import {
  createWebhook,
  updateWebhook,
  updateWebhookAddresses,
  deleteWebhook,
} from "@/lib/alchemy/webhooks";
import { Webhook } from "@/lib/alchemy/types";
import { appSettings } from "../appSettings";
import { headers } from "next/headers";

export async function updateWebhookStatus({
  webhookIds,
  isActive,
}: {
  webhookIds: string[];
  isActive: boolean;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  // Alchemy side
  for await (const webhookId of webhookIds) {
    await updateWebhook(webhookId, isActive);
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
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  const createdWebhooks: Webhook[] = [];
  const deletedWebhookIds: string[] = [];
  const updatedWebhooks: NonNullable<
    UpdatePayload[keyof UpdatePayload]["update"]
  >[] = [];

  for await (const networkStr of Object.keys(payload)) {
    const network = networkStr as keyof UpdatePayload;

    // create
    if (payload[network].create) {
      // http://localhost can't be use ! error 400
      const webhookUrl =
        (process.env.NODE_ENV === "production"
          ? (await headers()).get("origin")
          : "https://localtest.ioulos.com") + "/api/alchemyHook";

      const result = await createWebhook(
        webhookUrl,
        network,
        payload[network].create.addresses
      );
      createdWebhooks.push({
        ...result,
        addresses: payload[network].create.addresses,
      });
    }
    // Delete
    if (payload[network].delete) {
      const webhookId = payload[network].delete!.webhookId;
      await deleteWebhook(webhookId);
      deletedWebhookIds.push(webhookId);
    }
    //Update
    if (payload[network].update) {
      const webhookId = payload[network].update!.webhookId;
      const addressesToAdd = payload[network].update!.addressesToAdd;
      const addressesToRemove = payload[network].update!.addressesToRemove;

      await updateWebhookAddresses(webhookId, {
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

  // return updated user
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
