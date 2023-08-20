import React, { ChangeEvent, useContext, useEffect, useState } from "react";
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
  Tooltip,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { ServerStatusContext } from "../contexts/ServerStatusContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import {
  addAndRemoveAddresses,
  createWebhook,
  deleteWebhook,
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
  const currentWebhooksStatus: webhooksStatus = {};
  appSettings.chains.forEach((chain) => {
    currentWebhooksStatus[chain.alchemyMainnet] = {};
    getAllWallet().forEach((wallet) => {
      if (wallet instanceof AddressWallet || wallet instanceof Web3Wallet) {
        currentWebhooksStatus[chain.alchemyMainnet][wallet.address] = false;
      }
    });
  });
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

  const allWalletWithAddress = allWallet.filter(
    (wallet) => wallet.type === "AddressWallet" || wallet.type === "Web3Wallet"
  ) as unknown as AddressWallet[] | Web3Wallet[];

  const isConfigurable =
  serverStatus.isAuthToken && userSettings.web3UserId ? true : false;

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
    let newWebhooksUserSetting=userSettings.webhooks
    for await (const chainConfig of appSettings.chains) {
      const network = chainConfig.alchemyMainnet;
      const initialCount = countTrue(initialConfig[network]);
      const newCount = countTrue(webhooksStatus[network]);
      const webhookId = userSettings.webhooks.find(
        (webhook) => webhook.network === chainConfig.alchemyMainnet
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

      // Create Webhook
      if (initialCount === 0 && added.length != 0) {
        console.log("[Webhooks] Create webhook on", network);
        try {
          const result = await createWebhook(network, added);
          const createdWebhook = {
            ...result,
            ["addresses"]: added,
          };
          // Save setting
          newWebhooksUserSetting=[...newWebhooksUserSetting,createdWebhook]
          // Feedback
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
      //Delete Webhook
      if (initialCount != 0 && newCount === 0) {
        console.log(`[Webhooks] Delete webhook ${webhookId} on ${network}`);
        try {
          await deleteWebhook(webhookId as string);
          newWebhooksUserSetting=newWebhooksUserSetting.filter((wh) => wh.id != webhookId)
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
      //Add et remove adressses
      if (initialCount != 0 && newCount != 0 && initialCount != newCount) {
        try {
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
    }
    //Update locastorage and state
    updateUserSettings("webhooks", newWebhooksUserSetting);
    setUserSettings(getUserSettings());
  };

  //Synchronize with an update of usersettings
  useEffect(() => {
    setWebhooksStatus(parseWebhooksSettings());
    console.log("useEffect syncro usersetting");
  }, [userSettings.webhooks]);

  console.log("[Render] Webhook Settings");
  return (
    <>
      <Box padding={5} borderWidth="1px" borderRadius="lg">
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="email-alerts" mb="0">
            Enable address activity notification?
          </FormLabel>
          <Switch id="email-alerts" isDisabled={!isConfigurable} />
          <Tooltip
            label={
              isConfigurable
                ? "Active real time address activity notifications."
                : "Disabled : No alchemy auth token or no web3id"
            }
            placement="auto-end"
          >
            <FontAwesomeIcon icon={faQuestionCircle} pull="right" size="xs" />
          </Tooltip>
        </FormControl>
        <TableContainer>
          <Table variant="simple" size={{ base: "sm", md: "md" }}>
            <Thead>
              <Tr>
                <Th>Address</Th>
                <Th width={0}>Ethereum</Th>
                <Th width={0}>Polygon</Th>
              </Tr>
            </Thead>
            <Tbody>
              {allWalletWithAddress.map((wallet) => (
                <Tr key={wallet.id}>
                  <Td>{wallet.displayName}</Td>
                  <Td textAlign={"center"}>
                    <Checkbox
                      name={wallet.address}
                      value={Network.ETH_MAINNET}
                      onChange={handleChange}
                      isChecked={
                        webhooksStatus[Network.ETH_MAINNET][wallet.address]
                      }
                    />
                  </Td>
                  <Td textAlign={"center"}>
                    <Checkbox
                      name={wallet.address}
                      value={Network.MATIC_MAINNET}
                      onChange={handleChange}
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
        <Button onClick={handleSave}>Save</Button>
      </Box>
    </>
  );
}
