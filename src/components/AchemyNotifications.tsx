import React, { useEffect } from "react";
import { Socket } from "socket.io-client";

interface Props {
  socket: Socket;
}

export default function AchemyNotifications({ socket }: Props) {

  function onNotification(value: string) {
    console.log(JSON.parse(value));
  }

  useEffect(() => {
    console.log("useEffect Notification");
    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
    };
  }, [socket]);

  return <div>AchemyNotifications</div>;
}
