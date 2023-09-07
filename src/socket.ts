import { SocketOptions, io } from "socket.io-client";

let connectedUser = "";
try {
  const res = await fetch("/siwe/me");
  const json = await res.json();
  connectedUser = json.address;
} catch (error) {
  console.log(error);
}

const options: SocketOptions = connectedUser ? { auth: { connectedUser } } : {};
// Connect to websocket server on localhost
export const socket = io("", options);
