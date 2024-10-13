"use server";
import { appSettings } from "../appSettings";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { WalletType } from "@/types";
import { AddressWallet, CustomWallet } from "@prisma/client";
import { UpdatePayload, updateWebhooks } from "./webhook";

export async function addAddressWallet({
  address,
  ens,
}: {
  address: string;
  ens: string | null;
}) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // Address wallet already exist in db
  const existingWalletAddress = await db.addressWallet.findUnique({
    where: { address },
  });

  const addressWalletCount = await db.addressWallet.count({
    where: { users: { some: { address: session.address } } },
  });
  const customWalletCount = await db.customWallet.count({
    where: { userAddress: session.address },
  });

  if (existingWalletAddress) {
    // Connect to existing addresswallet
    await db.user.update({
      where: { address: session.address },
      data: {
        addressWallets: { connect: { address } },
      },
    });
  } else {
    // create a new one
    await db.addressWallet.create({
      data: {
        address,
        lastfetch: "2009-01-03T18:15:05Z",
        ens,
        users: { connect: { address: session.address } },
      },
    });
  }

  if (addressWalletCount + customWalletCount === 0) {
    // First wallet make it selected
    await updateSelectedWallet(address);
  }
}

export async function addCustomWallet(name: string) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const addressWalletCount = await db.addressWallet.count({
    where: { address: session.address },
  });
  const customWalletCount = await db.customWallet.count({
    where: { userAddress: session.address },
  });
  let updatedUser = await db.user.update({
    where: { address: session.address },
    data: {
      customWallets: { create: { lastfetch: "2009-01-03T18:15:05Z", name } },
    },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });

  if (addressWalletCount + customWalletCount === 0) {
    // First wallet make it selected, must be the last one of customWallets
    updatedUser = await updateSelectedWallet(
      updatedUser.customWallets.at(-1)!.id
    );
  }
  return updatedUser;
}

export async function removeWallet({
  walletId,
  type,
}: {
  walletId: string;
  type: WalletType;
}) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // Get current data
  const currentUser = (await db.user.findUnique({
    where: { address: session.address },
    include: {
      addressWallets: true,
      customWallets: true,
      groups: true,
      webhooks: true,
    },
  }))!;

  // 1. Modify groups
  // Analyse current group
  const groupIdToDelete: string[] = [];
  const groupToUpdate: { id: string; walletIds: string[] }[] = [];
  currentUser.groups.forEach((group) => {
    if (group.walletIds.includes(walletId)) {
      if (group.walletIds.length === 1) {
        //Last wallet so, need to delete group
        groupIdToDelete.push(group.id);
      } else {
        //Remove wallet to group
        groupToUpdate.push({
          id: group.id,
          walletIds: group.walletIds.filter(
            (gWalletId) => gWalletId != walletId
          ),
        });
      }
    }
  });
  // Delete Group
  if (groupIdToDelete.length != 0) {
    await db.user.update({
      where: { address: session.address },
      data: {
        selectedWalletId: null,
        selectedGroupId: null,
        groups: {
          delete: groupIdToDelete.map((id) => {
            return { id };
          }),
        },
      },
    });
  }
  // Update groups
  if (groupToUpdate.length != 0) {
    for await (const group of groupToUpdate) {
      await db.group.update({
        where: { id: group.id },
        data: { walletIds: group.walletIds },
      });
    }
  }

  // Webhooks
  const webhookToUpdate = currentUser.webhooks.find((wh) =>
    wh.addresses.includes(walletId)
  );
  if (webhookToUpdate) {
    const payload: UpdatePayload = {
      "eth-mainnet": { create: null, delete: null, update: null },
      "polygon-mainnet": { create: null, delete: null, update: null },
    };
    if (webhookToUpdate.addresses.length >= 2) {
      // Update
      payload[
        webhookToUpdate.network as (typeof appSettings.chains)[number]["alchemyMainnet"]
      ].update = {
        webhookId: webhookToUpdate.id,
        addressesToAdd: [],
        addressesToRemove: [walletId],
      };
    } else {
      // Delete case
      payload[
        webhookToUpdate.network as (typeof appSettings.chains)[number]["alchemyMainnet"]
      ].delete = { webhookId: webhookToUpdate.id };
    }
    // update on alchemy and db
    await updateWebhooks(payload);
  }

  // 2.Update User
  let updatedUser;
  switch (type) {
    case "AddressWallet":
      {
        // Disconnect to related addressWallet without remove it
        updatedUser = await db.user.update({
          where: { address: session.address },
          data: {
            addressWallets: { disconnect: { address: walletId } },
          },
          include: {
            addressWallets: true,
            customWallets: true,
            groups: true,
            webhooks: true,
          },
        });
      }

      break;
    case "CustomWallet":
      {
        // Delete custom Wallet
        updatedUser = await db.user.update({
          where: { address: session.address },
          data: {
            customWallets: { delete: { id: walletId } },
          },
          include: {
            addressWallets: true,
            customWallets: true,
            groups: true,
            webhooks: true,
          },
        });
      }
      break;
  }

  // 3.Modify selected Walletid/GroupId, if it's selected wallet or a selected group removed
  if (
    updatedUser.selectedWalletId === walletId ||
    (updatedUser.selectedGroupId &&
      groupIdToDelete.includes(updatedUser.selectedGroupId))
  ) {
    if (updatedUser.addressWallets.length === 0) {
      //Last wallet, Select first custom Wallet or if no custom wallet set to null
      return await db.user.update({
        where: { address: session.address },
        data: {
          selectedWalletId:
            updatedUser.customWallets.length != 0
              ? updatedUser.customWallets[0].id
              : null,
          selectedGroupId: null,
        },
        include: {
          groups: true,
          addressWallets: true,
          customWallets: true,
          webhooks: true,
        },
      });
    } else {
      //Select first addresswallet
      return await db.user.update({
        where: { address: session.address },
        data: {
          selectedWalletId: updatedUser.addressWallets[0].address,
          selectedGroupId: null,
        },
        include: {
          groups: true,
          addressWallets: true,
          customWallets: true,
          webhooks: true,
        },
      });
    }
  }
  return updatedUser;
}

export async function updateAddressWallet({
  address,
  nativeTokens,
  tokens,
  defi,
}: {
  address: string;
  nativeTokens: AddressWallet["nativeTokens"];
  tokens: AddressWallet["tokens"];
  defi: AddressWallet["defi"];
}) {
  return await db.addressWallet.update({
    where: { address },
    data: { nativeTokens, tokens, defi, lastfetch: new Date() },
  });
}

export async function updateCustomWallet({
  walletId,
  coins,
}: {
  walletId: string;
  coins: CustomWallet["coins"];
}) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return await db.user.update({
    where: { address: session.address },
    data: {
      customWallets: { update: { where: { id: walletId }, data: { coins } } },
    },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}

export async function updateSelectedWallet(selectedWalletId: string) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  return await db.user.update({
    where: { address: session.address },
    data: { selectedWalletId: selectedWalletId, selectedGroupId: null },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}
