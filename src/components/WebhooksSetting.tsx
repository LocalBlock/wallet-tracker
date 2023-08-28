import React, { ChangeEvent, useContext, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  FormHelperText,
  Flex,
  Badge,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { ServerStatusContext } from "../contexts/ServerStatusContext";
import {
  addAndRemoveAddresses,
  createWebhook,
  deleteWebhook,
  updateWebhookStatus,
} from "../functions/Alchemy";
import {
  getAllWallet,
  getUserSettings,
  updateUserSettings,
} from "../functions/localstorage";
import { AllWalletContext } from "../contexts/AllWalletContext";
import { AddressWallet, Web3Wallet } from "../classes/Wallet";
import { Network, Webhook } from "alchemy-sdk";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { appSettings } from "../settings/appSettings";

export type webhooksStatus = {
  [network: string]: {
    [address: string]: boolean;
  };
};
export type WebhookWithAddresses = Webhook & {
  addresses: string[];
};

function parseWebhooksSettings() {
  //Create webhookStatus from all chain and wallet address
  const currentWebhooksStatus: webhooksStatus = {};
  appSettings.chains.forEach((chain) => {
    currentWebhooksStatus[chain.alchemyMainnet] = {};
    getAllWallet().forEach((wallet) => {
      if (wallet instanceof AddressWallet || wallet instanceof Web3Wallet) {
        currentWebhooksStatus[chain.alchemyMainnet][wallet.address] = false;
      }
    });
  });
  // Pass value from usersettings
  getUserSettings().webhooks.forEach((webhook) => {
    getAllWallet().forEach((wallet) => {
      if (wallet instanceof AddressWallet || wallet instanceof Web3Wallet) {
        if (webhook.addresses.includes(wallet.address))
          currentWebhooksStatus[webhook.network][wallet.address] = true;
      }
    });
  });
  return currentWebhooksStatus;
}

function countTrue(obj: webhooksStatus[""]) {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (value) count++;
  }
  return count;
}

function addOrRemoveAddressesArray(
  originalArray: string[],
  added: string[],
  deleted: string[]
): string[] {
  // Copie le tableau d'origine pour éviter de le modifier directement.
  const newArray = [...originalArray];
  // Ajoute les éléments de 'added' au nouveau tableau.
  added.forEach((item) => {
    if (!newArray.includes(item)) {
      newArray.push(item);
    }
  });
  // Supprime les éléments de 'deleted' du nouveau tableau.
  deleted.forEach((item) => {
    const index = newArray.indexOf(item);
    if (index !== -1) {
      newArray.splice(index, 1);
    }
  });
  return newArray;
}

export default function WebhooksSettings() {
  const serverStatus = useContext(ServerStatusContext);
  const { allWallet } = useContext(AllWalletContext);
  const { userSettings, setUserSettings } = useContext(UserSettingsContext);
  const toast = useToast();
  const initialConfig = parseWebhooksSettings();
  const [webhooksStatus, setWebhooksStatus] = useState(initialConfig);
  const [isActive, setIsActive] = useState(userSettings.notificationsEnable);

  const allWalletWithAddress = allWallet.filter(
    (wallet) => wallet.type === "AddressWallet" || wallet.type === "Web3Wallet"
  ) as unknown as AddressWallet[] | Web3Wallet[];

  const isConfigurable =
    serverStatus.isConnected &&
    serverStatus.isAuthToken &&
    userSettings.web3UserId
      ? true
      : false;

  // Active or desactive Webhooks
  const handleIsActive = async () => {
    //Update state on Alchemy
    for await (const webhook of userSettings.webhooks) {
      await updateWebhookStatus(webhook.id, !isActive);
    }
    //Update userSetting
    const newWebhookSettings = userSettings.webhooks.map((webhook) => {
      return { ...webhook, ["isActive"]: !isActive };
    });
    setIsActive(!isActive);
    updateUserSettings("webhooks", newWebhookSettings, false);
    updateUserSettings("notificationsEnable", !isActive);
    setUserSettings(getUserSettings());
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const network = e.target.value as Network;
    const address = e.target.name;
    const isCheck = e.target.checked;
    const newStatus = {
      ...webhooksStatus,
      [network]: { ...webhooksStatus[network], [address]: isCheck },
    };
    setWebhooksStatus(newStatus);
  };

  const handleSave = async () => {
    // compare between all changes mades in form with initial Status
    let newWebhooksUserSetting = userSettings.webhooks;
    for await (const chainConfig of appSettings.chains) {
      const network = chainConfig.alchemyMainnet;
      const initialCount = countTrue(initialConfig[network]);
      const newCount = countTrue(webhooksStatus[network]);
      const webhookId = userSettings.webhooks.find(
        (webhook) => webhook.network === network
      )?.id;

      const added: string[] = [];
      const deleted: string[] = [];
      // identify added or removed addresses
      for (const wallet of allWalletWithAddress) {
        if (
          initialConfig[network][wallet.address] !=
          webhooksStatus[network][wallet.address]
        ) {
          if (webhooksStatus[network][wallet.address] === true)
            added.push(wallet.address);
          else deleted.push(wallet.address);
        }
      }

      try {
        let isSaved = false;
        // Create Webhook
        if (initialCount === 0 && added.length != 0) {
          console.log("[Webhooks] Create webhook on", network);

          const result = await createWebhook(network, added);
          const createdWebhook = {
            ...result,
            ["addresses"]: added,
          };
          // Save setting
          newWebhooksUserSetting = [...newWebhooksUserSetting, createdWebhook];
          isSaved = true;
        }
        //Delete Webhook
        if (initialCount != 0 && newCount === 0) {
          console.log(`[Webhooks] Delete webhook ${webhookId} on ${network}`);

          await deleteWebhook(webhookId as string);
          newWebhooksUserSetting = newWebhooksUserSetting.filter(
            (wh) => wh.id != webhookId
          );
          isSaved = true;
        }
        //Add et remove adressses
        if (initialCount != 0 && newCount != 0 && initialCount != newCount) {
          console.log(
            `[Webhooks] Add and remove addresses on ${webhookId}:${network}`
          );
          await addAndRemoveAddresses(webhookId as string, added, deleted);
          // Save new webhook setting
          const index = newWebhooksUserSetting.findIndex(
            (wh) => wh.id === webhookId
          );
          const newAddresses = addOrRemoveAddressesArray(
            newWebhooksUserSetting[index].addresses,
            added,
            deleted
          );
          const newWebhookConfig = {
            ...newWebhooksUserSetting[index],
            ["addresses"]: newAddresses,
          };
          newWebhooksUserSetting = newWebhooksUserSetting.map((wh) =>
            wh.id === webhookId ? newWebhookConfig : wh
          );
          isSaved = true;
        }
        isSaved &&
          toast({
            title: "Settings saved.",
            description: "Notifications updated",
            status: "success",
          });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error.",
          description: "Sowething's wrong, notifications not updated",
          status: "error",
        });
      }
    }
    //Update locastorage and state
    updateUserSettings("webhooks", newWebhooksUserSetting);
    setUserSettings(getUserSettings());
  };

  console.log("[Render] Webhook Settings");
  return (
    <>
      <Box padding={4} borderWidth="2px" borderRadius="lg">
        <FormControl>
          <Flex alignItems="center" gap={2}>
            <Badge colorScheme="yellow">Beta</Badge>
            <FormLabel htmlFor="email-alerts" mb="0">
              Enable notifications ?
            </FormLabel>
            <Switch
              id="email-alerts"
              isDisabled={!isConfigurable}
              onChange={handleIsActive}
              isChecked={isActive}
            />
          </Flex>
          <FormHelperText>
            {isConfigurable
              ? "Active real time notifications. Receive a notifictaion when there is activity on wallet addresses."
              : "Disabled : Missing alchemy auth token or web3id"}
          </FormHelperText>
        </FormControl>
        {allWalletWithAddress.length != 0 ? (
          <TableContainer marginTop={5}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th paddingInlineStart={0}>Address</Th>
                  <Th paddingX={0} width={0}>
                    Ethereum
                  </Th>
                  <Th paddingInlineEnd={0} width={0}>
                    Polygon
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {allWalletWithAddress.map((wallet) => (
                  <Tr key={wallet.id}>
                    <Td paddingInlineStart={0}>{wallet.displayName}</Td>
                    <Td textAlign={"center"}>
                      <Checkbox
                        name={wallet.address}
                        value={Network.ETH_MAINNET}
                        onChange={handleChange}
                        isDisabled={!isActive || !serverStatus.isConnected}
                        isChecked={
                          webhooksStatus[Network.ETH_MAINNET][wallet.address]
                        }
                      />
                    </Td>
                    <Td textAlign={"center"} paddingInlineEnd={0}>
                      <Checkbox
                        name={wallet.address}
                        value={Network.MATIC_MAINNET}
                        onChange={handleChange}
                        isDisabled={!isActive || !serverStatus.isConnected}
                        isChecked={
                          webhooksStatus[Network.MATIC_MAINNET][wallet.address]
                        }
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        ) : (
          <Alert status="warning" marginTop={5}>
            <AlertIcon />
            Add one wallet to configure these settings
          </Alert>
        )}
        <Box textAlign={{ base: "center", md: "end" }} marginTop={5} display={allWalletWithAddress.length=== 0?"none":undefined }>
          <Button
            onClick={handleSave}
            isDisabled={!isActive || !serverStatus.isConnected}
          >
            Save
          </Button>
        </Box>
      </Box>
    </>
  );
}
