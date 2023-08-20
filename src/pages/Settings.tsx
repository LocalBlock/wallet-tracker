import React from "react";
import Web3UserId from "../components/Web3UserId";
import WebhooksSettings from "../components/WebhooksSetting";


export default function Settings() {
  console.log("[Render] Settings");
  return (
    <>
      <Web3UserId />
      <WebhooksSettings/>
    </>
  );
}
