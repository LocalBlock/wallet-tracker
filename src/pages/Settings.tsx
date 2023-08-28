import React from "react";
import Web3UserId from "../components/Web3UserId";
import WebhooksSettings from "../components/WebhooksSetting";
import { Flex } from "@chakra-ui/react";


export default function Settings() {
  console.log("[Render] Settings");
  return (
    <Flex direction={"column"} gap={5}>
      <Web3UserId />
      <WebhooksSettings/>
    </Flex>
  );
}
