import {
  Alchemy,
  AlchemySettings,
  Network,
  WebhookType,
  Utils,
} from "alchemy-sdk";
import { appSettings } from "../settings/appSettings";
import { wait } from "../functions/utils";

//TODO : JSDOC
export async function getAllTokenBalance(address: string, chainId: string) {
  // Configures the Alchemy SDK
  const config: AlchemySettings = {
    url: `/alchemyfetch?network=${
      appSettings.chains.find((chain) => chain.id === chainId)?.alchemyMainnet
    }`,
  };
  const alchemy = new Alchemy(config);
  //Fetch Data, loop if result has pageKey, and add pause preventing THROUGHPUT LIMITS (computing units per second (CUPS) limit in free :330)
  let page = {};
  const tokens = [];
  let fetchAPI = true;
  while (fetchAPI) {
    const balances = await alchemy.core.getTokensForOwner(address, page);
    tokens.push(...balances.tokens);
    if (!balances.pageKey) {
      // Stop loop
      fetchAPI = false;
      //console.log("No more token to fetch");
    } else {
      page = { pageKey: balances.pageKey };
      //console.log("More token to fetch");
    }
    //Wait before next fetch to avoid throughput limits API
    await wait(appSettings.fetchDelayRequest);
  }
  // Remove tokens with zero balance
  const nonZeroBalances = tokens.filter((token) => token.rawBalance !== "0");

  //Modify fetching tokens from Alchemy
  nonZeroBalances.forEach((token) => {
    //Add chain info
    Object.defineProperty(token, "chain", { value: chainId, enumerable: true });
    //Delete unwanted property from Alchemy
    if (token.logo || token.logo === undefined) delete token.logo;
    //if (token.name || token.name === undefined) delete token.name;
    //if (token.symbol || token.symbol === undefined) delete token.symbol;
  });

  //Return as my new Type
  return nonZeroBalances;
}

export async function getNativeBalance(address: string, chainId: string) {
  //Select Network config
  const config: AlchemySettings = {
    url: `/alchemyfetch?network=${
      appSettings.chains.find((chain) => chain.id === chainId)?.alchemyMainnet
    }`,
  };
  const alchemy = new Alchemy(config);
  const balanceHex = await alchemy.core.getBalance(address, "latest");
  return Utils.formatEther(balanceHex);
}

export async function resolveENS(ens: string) {
  const config: AlchemySettings = {
    url: `/alchemyfetch?network=${Network.ETH_MAINNET}`,
  };
  const alchemy = new Alchemy(config);
  console.log("Resolving ENS " + ens);
  const ensAddresse = await alchemy.core.resolveName(ens);
  return ensAddresse;
}

// Webhooks
// https://docs.alchemy.com/reference/notify-api-quickstart
// Get all webhooks
export async function getAllWebhooks() {
  const config: AlchemySettings = {
    authToken: "FAKE_VALUE",
    url: `/alchemynotify`,
  };
  const alchemy = new Alchemy(config);
  return await alchemy.notify.getAllWebhooks();
}

export async function getAllAddresses(webhook_id: string) {
  const config: AlchemySettings = {
    authToken: "FAKE_VALUE",
    url: `/alchemynotify`,
  };
  const alchemy = new Alchemy(config);
  return await alchemy.notify.getAddresses(webhook_id, {
    limit: 10,
  });
}

export async function createWebhook(network:Network, addresses: string[]) {
  const config: AlchemySettings = {
    authToken: "FAKE_VALUE",
    url: `/alchemynotify`,
  };
  const alchemy = new Alchemy(config);

  // Set weekhook URL: In dev from env.local, in prod origin
  const webhookUrl =
    import.meta.env.MODE === "production"
      ? window.location.origin + "/alchemyhook"
      : import.meta.env.VITE_ALCHEMY_WEBHOOKURL;

  return await alchemy.notify.createWebhook(
    webhookUrl,
    WebhookType.ADDRESS_ACTIVITY,
    {
      addresses: addresses,
      network: network,
    }
  );
}

export async function addAndRemoveAddresses(
  webhook_id: string,
  addressesToAdd: string[] = [],
  addressesToRemove: string[] = []
) {
  const config: AlchemySettings = {
    authToken: "FAKE_VALUE",
    url: `/alchemynotify`,
  };
  const alchemy = new Alchemy(config);
  return await alchemy.notify.updateWebhook(webhook_id, {
    addAddresses: addressesToAdd,
    removeAddresses: addressesToRemove,
  });
}

export async function deleteWebhook(webhook_id:string){
  const config: AlchemySettings = {
    authToken: "FAKE_VALUE",
    url: `/alchemynotify`,
  };
  const alchemy = new Alchemy(config);
  return await alchemy.notify.deleteWebhook(webhook_id);
}
