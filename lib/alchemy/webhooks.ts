import { WebhookResponse, Network, WebhookType, Webhook } from "./types";

/**
 * Create a webhook of type ADDRESS_ACTIVITY only
 * @param webhookUrl URL where requests are sent
 * @param network Network of webhook
 * @param addresses List of addresses you want to track. Required for address activity webhooks only.
 * @returns
 */
export async function createWebhook(
  webhookUrl: string,
  network: Network,
  addresses: string[]
): Promise<Webhook> {
  const url = `https://dashboard.alchemy.com/api/create-webhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Alchemy-Token": process.env.ALCHEMY_AUTHTOKEN!,
    },
    body: JSON.stringify({
      network: NETWORK_TO_WEBHOOK_NETWORK.get(network),
      webhook_type: WebhookType.ADDRESS_ACTIVITY,
      webhook_url: webhookUrl,
      addresses: addresses,
    }),
  });
  const jsonResponse = await res.json();

  if (res.ok) {
    // The request was successful
    const webhookResponse = jsonResponse as WebhookResponse;
    return {
      id: webhookResponse.data.id,
      network: WEBHOOK_NETWORK_TO_NETWORK[webhookResponse.data.network],
      type: webhookResponse.data.webhook_type,
      url: webhookResponse.data.webhook_url,
      isActive: webhookResponse.data.is_active,
      timeCreated: new Date(webhookResponse.data.time_created),
      signingKey: webhookResponse.data.signing_key,
      version: webhookResponse.data.version,
      addresses: webhookResponse.data.addresses,
    };
  } else {
    //  the request encountered an error
    const alchemyResponseError = jsonResponse as Error;
    console.log(
      `Create webhook failed with code :${res.status}`,
      alchemyResponseError.message
    );
    throw new Error(alchemyResponseError.message);
  }
}
/**
 * Add or remove addresses from a specific webhook.
 * @param id ID of the address activity webhook
 * @param update Object with List of addresses to add, use [] if none and List of addresses to remove, use [] if none.
 * @returns Returns empty object.
 */
export async function updateWebhookAddresses(
  id: string,
  update: { addAddresses: string[]; removeAddresses: string[] }
) {
  const url = `https://dashboard.alchemy.com/api/update-webhook-addresses`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Alchemy-Token": process.env.ALCHEMY_AUTHTOKEN!,
    },
    body: JSON.stringify({
      webhook_id: id,
      addresses_to_add: update.addAddresses,
      addresses_to_remove: update.removeAddresses,
    }),
  });
  const jsonResponse = await res.json();
  if (res.ok) {
    // The request was successful
  } else {
    //  the request encountered an error
    const alchemyResponseError = jsonResponse as Error;
    console.log(
      `Update webhook addresses failed with code :${res.status}`,
      alchemyResponseError.message
    );
    throw new Error(alchemyResponseError.message);
  }
}

/**
 * Allows you to set status of webhooks to active or inactive.
 * @param id ID of the address activity webhook
 * @param isActive set webhook to active state
 * @returns Returns updated webhook status.
 */
export async function updateWebhook(
  id: string,
  isActive: boolean
): Promise<Webhook> {
  const url = `https://dashboard.alchemy.com/api/update-webhook`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Alchemy-Token": process.env.ALCHEMY_AUTHTOKEN!,
    },
    body: JSON.stringify({
      webhook_id: id,
      is_active: isActive,
    }),
  });
  const jsonResponse = await res.json();
  if (res.ok) {
    // The request was successful
    const webhookResponse = jsonResponse as WebhookResponse;
    return {
      id: webhookResponse.data.id,
      network: webhookResponse.data.network,
      type: WEBHOOK_NETWORK_TO_NETWORK[webhookResponse.data.network],
      url: webhookResponse.data.webhook_url,
      isActive: webhookResponse.data.is_active,
      timeCreated: new Date(webhookResponse.data.time_created),
      signingKey: webhookResponse.data.signing_key,
      version: webhookResponse.data.version,
      addresses: webhookResponse.data.addresses,
    };
  } else {
    //  the request encountered an error
    const alchemyResponseError = jsonResponse as Error;
    console.log(
      `Update webhook status failed with code :${res.status}`,
      alchemyResponseError.message
    );
    throw new Error(alchemyResponseError.message);
  }
}
/**
 * Allows you to delete a webhook.
 * @param id ID of the address activity webhook.
 * @returns Returns empty object.
 */
export async function deleteWebhook(id: string) {
  const url = `https://dashboard.alchemy.com/api/delete-webhook?webhook_id=${id}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Alchemy-Token": process.env.ALCHEMY_AUTHTOKEN!,
    },
  });
  const jsonResponse = await res.json();
  if (res.ok) {
    // The request was successful
    // it returns a empty object noting to do
  } else {
    //  the request encountered an error
    const alchemyResponseError = jsonResponse as Error;
    console.log(
      `Delete webhook failed with code :${res.status}`,
      alchemyResponseError.message
    );
    throw new Error(alchemyResponseError.message);
  }
}

/**
 * Mapping of webhook network representations to the SDK's network representation.
 *
 * @internal
 */
const WEBHOOK_NETWORK_TO_NETWORK: { [key: string]: Network } = {
  ETH_MAINNET: Network.ETH_MAINNET,
  ETH_GOERLI: Network.ETH_GOERLI,
  ETH_SEPOLIA: Network.ETH_SEPOLIA,
  MATIC_MAINNET: Network.MATIC_MAINNET,
  MATIC_MUMBAI: Network.MATIC_MUMBAI,
  MATIC_AMOY: Network.MATIC_AMOY,
  ARB_MAINNET: Network.ARB_MAINNET,
  ARB_GOERLI: Network.ARB_GOERLI,
  ARB_SEPOLIA: Network.ARB_SEPOLIA,
  OPT_MAINNET: Network.OPT_MAINNET,
  OPT_GOERLI: Network.OPT_GOERLI,
  OPT_SEPOLIA: Network.OPT_SEPOLIA,
  BASE_MAINNET: Network.BASE_MAINNET,
  BASE_GOERLI: Network.BASE_GOERLI,
  BASE_SEPOLIA: Network.BASE_SEPOLIA,
  ZKSYNC_MAINNET: Network.ZKSYNC_MAINNET,
  ZKSYNC_SEPOLIA: Network.ZKSYNC_SEPOLIA,
};

/** Mapping of the SDK's network representation the webhook API's network representation. */
const NETWORK_TO_WEBHOOK_NETWORK: Map<Network, string> = Object.keys(
  Network
).reduce((map: Map<Network, string>, key) => {
  if (key in WEBHOOK_NETWORK_TO_NETWORK) {
    map.set(WEBHOOK_NETWORK_TO_NETWORK[key], key);
  }
  return map;
}, new Map());
