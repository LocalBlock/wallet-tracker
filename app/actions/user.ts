"use server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";

export async function getUserData() {
  const session = await getIronSession<SessionData>(
    // @ts-expect-error for cookies()
    cookies(),
    sessionOptions
  );

  if (!session.address) return null;

  const user = await db.user.findUnique({
    where: { address: session.address },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });

  if (user) {
    return user;
  }
  return null;
}

export async function updateSelectedWallet({
  selectedWalletId,
  selectedGroupId,
}: {
  selectedWalletId: string | null;
  selectedGroupId: string | null;
}) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  return await db.user.update({
    where: { address: session.address },
    data: {
      selectedWalletId: selectedWalletId,
      selectedGroupId: selectedGroupId,
    },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}

export async function updateSelectedCurrency(newCurrency: string) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  return await db.user.update({
    where: { address: session.address },
    data: { currency: newCurrency },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}

export async function createGroup({
  name,
  walletIds,
}: {
  name: string;
  walletIds: string[];
}) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  return await db.user.update({
    where: { address: session.address },
    data: { groups: { create: [{ name, walletIds }] } },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}

export async function updateGroup({
  groupId,
  name,
  walletIds,
}: {
  groupId: string;
  name: string;
  walletIds: string[];
}) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return await db.user.update({
    where: { address: session.address },
    data: {
      groups: { update: { where: { id: groupId }, data: { name, walletIds } } },
    },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}

export async function removeGroup(groupId: string) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  await db.group.delete({ where: { id: groupId } });

  const user = (await db.user.findUnique({
    where: { address: session.address },
    include: { addressWallets: true, customWallets: true },
  }))!;

  // Update selected wallet
  if (user.selectedGroupId === groupId) {
    if (user.addressWallets.length != 0) {
      // Select first addressWallet
      return await db.user.update({
        where: { address: session.address },
        data: {
          selectedWalletId: user.addressWallets[0].address,
          selectedGroupId: null,
        },
        include: {
          groups: true,
          addressWallets: true,
          customWallets: true,
          webhooks: true,
        },
      });
    } else if (user.customWallets.length != 0) {
      // Select first customWallet
      return await db.user.update({
        where: { address: session.address },
        data: {
          selectedWalletId: user.customWallets[0].id,
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
      // no Selected wallet
      return await db.user.update({
        where: { address: session.address },
        data: { selectedWalletId: null, selectedGroupId: null },
        include: {
          groups: true,
          addressWallets: true,
          customWallets: true,
          webhooks: true,
        },
      });
    }
  }
}

export async function updateSelectedChains(newSelectedChains: string[]) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const updatedUser = await db.user.update({
    where: { address: session.address },
    data: { selectedChains: newSelectedChains },
    include: {
      addressWallets: true,
      customWallets: true,
      groups: true,
      webhooks: true,
    },
  });
  return updatedUser;
}
