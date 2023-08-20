import React, { useContext, useEffect, useState } from "react";
import { Alert, AlertIcon } from "@chakra-ui/react";
import { ServerStatusContext } from "../contexts/ServerStatusContext";

export default function ServerStatus() {
  const serverStatus = useContext(ServerStatusContext);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      if (serverStatus.isConnected) {
        if (!serverStatus.isApiKey)
          setMessage(
            "Alchemy API key environment variable has not been defined. You can't use this app without it."
          );
        else setMessage("");
      } else setMessage("Not connected to Websocket server");
    }, 10000);
    return () => clearInterval(interval);
  }, [serverStatus]);

  if (message) {
    return (
      <Alert status="error">
        <AlertIcon />
        {message}
      </Alert>
    );
  } else return null;
}
