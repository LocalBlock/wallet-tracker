"use server";
import { appSettings } from "../appSettings";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { WalletType } from "@/types";
import { AddressWallet, CustomWallet } from "@prisma/client";
import { fetchBeefyVaults } from "@/lib/beefy";
import { createCoinData, updateCoinData } from "./coinData";
import { UpdatePayload, updateWebhooks } from "./webhook";

export async function addAddressWallet({
  address,
  ens,
}: {
  address: string;
  ens: string | null;
}) {
  // @ts-ignore for cookies()
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

  // fetch tokens
  let { updatedUser, allIdsFetched } = await fetchTokensWallet(address);

  if (addressWalletCount + customWalletCount === 0) {
    // First wallet make it selected
    updatedUser = await updateSelectedWallet(address);
  }

  // Update data
  await updateCoinData(allIdsFetched);

  return updatedUser;
}

export async function addCustomWallet(name: string) {
  // @ts-ignore for cookies()
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
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // Get current data
  const currentUser = (await db.user.findUnique({
    where: { address: session.address },
    include: { addressWallets: true, customWallets: true, groups: true,webhooks:true },
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
  const webhookToUpdate=currentUser.webhooks.find(wh=>wh.addresses.includes(walletId))
  if (webhookToUpdate){
    const payload: UpdatePayload = {
      "eth-mainnet": { create: null, delete: null, update: null },
      "polygon-mainnet": { create: null, delete: null, update: null },
    };
    if (webhookToUpdate.addresses.length>=2){
      // Update
      payload[webhookToUpdate.network as (typeof appSettings.chains)[number]["alchemyMainnet"]].update = {
        webhookId: webhookToUpdate.id,
        addressesToAdd: [],
        addressesToRemove: [walletId],
      };
      
    }else{
      // Delete case
      payload[webhookToUpdate.network as (typeof appSettings.chains)[number]["alchemyMainnet"]].delete = { webhookId: webhookToUpdate.id };

    }
    // update on alchemy and db
    await updateWebhooks(payload)
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
          include: { addressWallets: true, customWallets: true, groups: true,webhooks:true },
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
          include: { addressWallets: true, customWallets: true, groups: true,webhooks:true },
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

export async function updateAddressWallet(
  address: string,
  nativeTokens: AddressWallet["nativeTokens"],
  tokens: AddressWallet["tokens"],
  defi: AddressWallet["defi"]
) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return await db.user.update({
    where: { address: session.address },
    data: {
      addressWallets: {
        update: {
          where: { address },
          data: { nativeTokens, tokens, defi, lastfetch: new Date() },
        },
      },
    },
    include: {
      groups: true,
      addressWallets: true,
      customWallets: true,
      webhooks: true,
    },
  });
}

export async function updateCustomWallet({
  walletId,
  coins,
}: {
  walletId: string;
  coins: CustomWallet["coins"];
}) {
  // @ts-ignore for cookies()
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
  // @ts-ignore for cookies()
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

export async function fetchTokensWallet(address: string) {
  const allTokenIds: string[] = [];
  const newNativeTokens: AddressWallet["nativeTokens"] = [];
  let newTokens: AddressWallet["tokens"] = [];
  const newUnIdentifiedTokens: Omit<
    AddressWallet["tokens"][number],
    "coinDataId"
  >[] = [];

  for await (const chain of appSettings.chains) {
    console.log("[Fetch] tokens on", chain.id);
    // 1 fetch Native balance from alchemy
    const nativeBalance = (await (
      await fetch(
        `http://localhost:3000/api/alchemy/core?sdkMethod=getNativeBalance&address=${address}&chainId=${chain.id}`
      )
    ).json()) as string;

    newNativeTokens.push({
      balance: nativeBalance,
      coinDataId: chain.tokenId,
      chain: chain.id,
    });

    allTokenIds.push(chain.tokenId);

    // 2 fetch tokens from alchemy
    const { tokens, unIdentifiedTokens } = (await (
      await fetch(
        `http://localhost:3000/api/alchemy/core?sdkMethod=getAllTokenBalance&address=${address}&chainId=${chain.id}`
      )
    ).json()) as {
      tokens: AddressWallet["tokens"];
      unIdentifiedTokens: Omit<AddressWallet["tokens"][number], "coinDataId">[];
    };

    // Merge tokens Chain
    newTokens.push(...tokens);
    newUnIdentifiedTokens.push(...unIdentifiedTokens);
  }

  // DEFI Step
  // Beefy
  console.log("[Fetch] Beefy");
  // Get beeyVaults and mutate newTokens and newUnIdentifiedTokens
  const beefyUserVaults = await fetchBeefyVaults(
    newTokens,
    newUnIdentifiedTokens
  );
  // Push coinDataId
  beefyUserVaults.forEach((vault) => {
    vault.tokens.forEach((token) => allTokenIds.push(token.id));
  });

  //AAVE
  // Fetch safetyModule
  console.log("[Fetch] Aave Safety Module");
  const safetyModule = (await (
    await fetch(
      `http://localhost:3000/api/aave?query=safetyModule&address=${address}`
    )
  ).json()) as AddressWallet["defi"]["aaveSafetyModule"];
  // Push coinDataId for fetching
  for (const stakedToken of Object.values(safetyModule)) {
    if (stakedToken.stakeTokenUserBalance != "0")
      allTokenIds.push(stakedToken.coinDataId);
  }

  // Fetch aave Pools
  console.log("[Fetch] Aave Pools");
  const aavePools = (await (
    await fetch(`http://localhost:3000/api/aave?query=pools&address=${address}`)
  ).json()) as {
    aaveV2: AddressWallet["defi"]["aaveV2"];
    aaveV3: AddressWallet["defi"]["aaveV3"];
  };
  const aTokensContractAddressToRemove: string[] = [];
  // Push coinDataId for fetching
  for (const chains of Object.values(aavePools)) {
    for (const aaveBalance of Object.values(chains)) {
      aaveBalance.userReservesData.forEach((urd) => {
        aTokensContractAddressToRemove.push(
          urd.reserve.aTokenAddress.toLowerCase()
        );
        allTokenIds.push(urd.coinDataId);
      });
    }
  }
  // Remove atoken pools tokens
  newTokens = newTokens.filter(
    (token) => !aTokensContractAddressToRemove.includes(token.contractAddress)
  );

  // Now can push all newToken id
  newTokens.forEach((token) => allTokenIds.push(token.coinDataId));

  // Buid defi objetc
  const defi = {
    aaveSafetyModule: safetyModule,
    aaveV2: aavePools.aaveV2,
    aaveV3: aavePools.aaveV3,
    beefy: beefyUserVaults,
  };

  // Save all Tokens to db
  const updatedUser = await updateAddressWallet(
    address,
    newNativeTokens,
    newTokens,
    defi
  );

  // Remove duplicate Id
  const allUniqueTokenIds = allTokenIds.filter(
    (value, index) => allTokenIds.indexOf(value) === index
  ); //remove duplicate

  // check if new Coindata
  const currentCoinDataIds = (await db.coinData.findMany()).map(
    (ccd) => ccd.id
  );
  const coinIdsDataToCreate = allUniqueTokenIds.filter(
    (id) => !currentCoinDataIds.includes(id)
  );
  if (coinIdsDataToCreate.length != 0) {
    await createCoinData(coinIdsDataToCreate);
  }

  return { updatedUser, allIdsFetched: allUniqueTokenIds };
}
