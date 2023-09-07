import React from "react";
import ConnectSetting from "../components/ConnectSettings";
import WebhooksSettings from "../components/WebhooksSetting";
import { Flex } from "@chakra-ui/react";


export default function Settings() {
  console.log("[Render] Settings");
  return (
    <Flex direction={"column"} gap={5}>
      <ConnectSetting />
      <WebhooksSettings/>
    </Flex>
  );
}
