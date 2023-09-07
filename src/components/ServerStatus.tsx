import React, { useContext } from "react";
import { Alert, AlertIcon } from "@chakra-ui/react";
import { ServerStatusContext } from "../contexts/ServerStatusContext";

export default function ServerStatus() {
  const { serverStatus } = useContext(ServerStatusContext);

  let message = "";
  if (serverStatus.isConnected) {
    if (!serverStatus.isApiKey)
      message =
        "Alchemy API key environment variable has not been defined. You can't use this app without it.";
  } else message = "Not connected to server";

  if (message) {
    return (
      <Alert status="error">
        <AlertIcon />
        {message}
      </Alert>
    );
  } else return null;
}
