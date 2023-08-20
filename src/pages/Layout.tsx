import React from "react";
import Navbar from "../components/Navbar";
import AlchemyNotifications from "../components/AchemyNotifications";
import { Outlet} from "react-router-dom";
import { Socket } from "socket.io-client";
import ServerStatus from "../components/ServerStatus";
import {Container } from "@chakra-ui/react";

interface Props {
  socket: Socket;
}

export default function Layout({ socket }: Props) {
  
  console.log("[Render] Layout");
  return (
    <>
      <AlchemyNotifications socket={socket} />
      <ServerStatus />
      <Navbar />
      <Container px={2} maxWidth={"container.md"}>
        <Outlet />
      </Container>
    </>
  );
}
