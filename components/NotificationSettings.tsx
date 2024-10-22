import React, { ChangeEvent, useState } from "react";
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
  Spinner,
} from "@chakra-ui/react";
import {
  UpdatePayload,
  updateWebhooks,
  updateWebhookStatus,
} from "@/app/actions/webhook";
import { AddressWallet, Webhook } from "@prisma/client";
import { displayName } from "@/lib/utils";
import { Network } from "@/lib/alchemy/types";
import { appSettings } from "@/app/appSettings";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type WebhooksStatus = {
  [network: string]: {
    [address: string]: boolean;
  };
};

function parseWebhooksSettings(
  allAddressWallet: AddressWallet[],
  webhooks: Webhook[]
) {
  //Create webhookStatus from all chain and wallet address
  const currentWebhooksStatus: WebhooksStatus = {};
  appSettings.chains.forEach((chain) => {
    currentWebhooksStatus[chain.alchemyMainnet] = {};
    allAddressWallet.forEach((wallet) => {
      currentWebhooksStatus[chain.alchemyMainnet][wallet.address] = false;
    });
  });
  // Pass value from current Webhooks config
  webhooks.forEach((webhook) => {
    allAddressWallet.forEach((wallet) => {
      if (webhook.addresses.includes(wallet.address))
        currentWebhooksStatus[webhook.network][wallet.address] = true;
    });
  });
  return currentWebhooksStatus;
}

function countTrue(obj: WebhooksStatus[""]) {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (value) count++;
  }
  return count;
}

type Props = {
  allAddressWallet: AddressWallet[];
  isEnable: boolean;
  webhooks: Webhook[];
};

export default function NotificationSettings({
  allAddressWallet,
  isEnable,
  webhooks,
}: Props) {
  const initialConfig = parseWebhooksSettings(allAddressWallet, webhooks);
  const [webhooksStatus, setWebhooksStatus] = useState(initialConfig);
  const toast = useToast();

  const queryClient = useQueryClient();
  const mutationWebhookStatus = useMutation({
    mutationFn: updateWebhookStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const mutationWebhookUpdate = useMutation({
    mutationFn: updateWebhooks,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  // Active or desactive Webhooks
  const handleIsActive = async () => {
    await mutationWebhookStatus.mutateAsync({
      webhookIds: webhooks.map((wh) => wh.id),
      isActive: !isEnable,
    });
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
    const payload: UpdatePayload = {
      "eth-mainnet": { create: null, delete: null, update: null },
      "polygon-mainnet": { create: null, delete: null, update: null },
    };

    // compare between all changes mades in form with initial Status
    for (const chainConfig of appSettings.chains) {
      const network = chainConfig.alchemyMainnet;
      const initialCount = countTrue(initialConfig[network]);
      const newCount = countTrue(webhooksStatus[network]);
      const webhookId = webhooks.find(
        (webhook) => webhook.network === network
      )?.id;

      const added: string[] = [];
      const deleted: string[] = [];
      // identify added or removed addresses
      for (const wallet of allAddressWallet) {
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
        payload[network].create = { addresses: added };
      }
      //Delete Webhook
      if (initialCount != 0 && newCount === 0) {
        console.log(`[Webhooks] Delete webhook ${webhookId} on ${network}`);
        payload[network].delete = { webhookId: webhookId! };
      }
      //Add et remove adressses
      if (initialCount != 0 && newCount != 0 && initialCount != newCount) {
        console.log(
          `[Webhooks] Add and remove addresses on ${webhookId}:${network}`
        );
        payload[network].update = {
          webhookId: webhookId!,
          addressesToAdd: added,
          addressesToRemove: deleted,
        };
      }
    }
    try {
      // Mutate
      await mutationWebhookUpdate.mutateAsync(payload);
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
  };

  return (
    <Box padding={4} borderWidth="2px" borderRadius="lg">
      <FormControl>
        <Flex alignItems="center" gap={2}>
          <Badge colorScheme="yellow">Beta</Badge>
          <FormLabel htmlFor="notification-enable" mb="0">
            Enable notifications ?
          </FormLabel>
          <Switch
            id="notification-enable"
            onChange={handleIsActive}
            isChecked={isEnable}
            isDisabled={allAddressWallet.length === 0}
          />
          {mutationWebhookStatus.isPending && <Spinner size="sm" />}
        </Flex>
        <FormHelperText>
          Active real time notifications. Receive a notifictaion when there is
          activity on wallet addresses.
        </FormHelperText>
      </FormControl>
      {allAddressWallet.length != 0 ? (
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
              {allAddressWallet.map((wallet) => (
                <Tr key={wallet.address}>
                  <Td paddingInlineStart={0}>
                    {displayName(wallet.address, wallet.ens)}
                  </Td>
                  <Td textAlign={"center"}>
                    <Checkbox
                      name={wallet.address}
                      value={Network.ETH_MAINNET}
                      onChange={handleChange}
                      isDisabled={!isEnable}
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
                      isDisabled={!isEnable}
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
      <Box
        textAlign={{ base: "center", md: "end" }}
        marginTop={5}
        display={allAddressWallet.length === 0 ? "none" : undefined}
      >
        <Button
          colorScheme="blue"
          onClick={handleSave}
          isDisabled={!isEnable}
          isLoading={mutationWebhookUpdate.isPending}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
}
