/**
 * Code from : https://youtu.be/ZbX4Ok9YX94?t=29319&si=EDu9XWhmD0rGqWO5
 */

import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import type { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { db } from "@/lib/db";
import { wait } from "@/lib/utils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function socketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (res.socket.server.io) {
    console.log("[Socket Server] is already running");
  } else {
    console.log("[Socket Server] is initializing");
    const httpServer: HttpServer = res.socket.server as never;
    const io = new SocketServer(httpServer, { path: "/api/socket/io" });
    res.socket.server.io = io;

    io.on("connection", async (socket) => {
      console.log(
        "[Socket Server] Client connected",
        socket.handshake.auth.userAddress
      );
      socket.on("disconnect", (reason) => {
        console.log(
          "[Socket Server] Client disconnected",
          socket.handshake.auth.userAddress,
          reason
        );
      });
      //Check if there is some pending notification to sent to user
      const pendingNotifications = await db.notification.findMany({
        where: {
          userAddress: socket.handshake.auth.userAddress,
          isSent: false,
        },
      });
      if (pendingNotifications.length != 0) {
        // Wait 2 sec and send
        await wait(5000);
        console.log(
          "[Socket Server] send pending notifications to",
          socket.handshake.auth.userAddress
        );
        for (const pendingNotification of pendingNotifications) {
          socket.emit("notification", pendingNotification);
          await db.notification.update({
            where: { id: pendingNotification.id },
            data: { isSent: true },
          });
        }
      }
    });
  }
  res.end();
}
