import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { Notification } from "@prisma/client";
import { db } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method === "POST") {
    const myNamespace = res.socket.server.io.of("/");
    const incomingNotifications = JSON.parse(req.body) as Notification[];

    // return all Socket instances
    const sockets = await myNamespace.fetchSockets();

    for (const incomingNotification of incomingNotifications) {
      if (sockets.length != 0) {
        for (const socket of sockets) {
          if (
            incomingNotification.userAddress ===
            socket.handshake.auth.userAddress
          ) {
            // User is connected send it to front end via websocket
            console.log("[Socket Server] Send notification to user");
            socket.emit("notification", incomingNotification);
            // Save notifation anyway, maybe usefull for debug or future features
            incomingNotification.isSent = true;
            await db.notification.create({ data: incomingNotification });
          } else {
            //Save it
            console.log("[Socket Server] Save notification's user to db");
            await db.notification.create({ data: incomingNotification });
          }
        }
      } else {
        // No isntance socket, so no connected user
        //Save it
        console.log("[Socket Server] Save notification's user to db");
        await db.notification.create({ data: incomingNotification });
      }
    }
    res.status(200).json("ok");
  } else {
    // Method Not Allowed
    res.status(405);
  }
}
