import express from "express";
import compression from "compression";
import cors from "cors";
import axios from "axios";
import path from "path";
import url from "url";
import http from "http";
import { Server } from "socket.io";
import { promises as fs } from "fs";
import dotenv from "dotenv";
import { NotificationdStorage } from "./Notification.js";

// Get environment variable in developpement mode
if (process.env.NODE_ENV != "production")
  dotenv.config({ path: "../.env.local" });

// constants
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDirName = "/app";
const PORT = 3000;
const APIKEY = process.env.VITE_ALCHEMY_APIKEY;
const AUTHTOKEN = process.env.VITE_ALCHEMY_AUTHTOKEN;

// Initialise data directory
try {
  // Create directory if not exist
  await fs.mkdir("data/users", { recursive: true });
} catch (error) {
  console.log(error);
}

console.log("Alchemy:", "APIKEY=" + APIKEY, "AUTHTOKEN=" + AUTHTOKEN);

// Express server with the appropriate routes for our webhook and web requests
const app = express()
  .set("trust proxy", 1) // trust first proxy
  .use(express.static(path.join(__dirname, appDirName))) //Serve static files
  .use(express.json())
  .use(compression()) //gzip compression
  .use(
    cors({
      origin: "http://localhost:5173",
      methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
      credentials: true,
    })
  )

  //Proxy backend for alchemy, why? to hide APIKEY, no sensitive information in front end
  .post("/alchemyfetch", (req, res) => {
    //rewrite url
    const url = `https://${req.query.network}.g.alchemy.com/v2/${APIKEY}`;
    const options = {
      method: "POST",
      url: url,
      headers: {
        "alchemy-ethers-sdk-method": req.headers["alchemy-ethers-sdk-method"],
        "alchemy-ethers-sdk-version": req.headers["alchemy-ethers-sdk-version"],
        "content-type": "application/json",
      },
      data: req.body,
    };
    // Fetch
    axios
      .request(options)
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        if (error.response) {
          // la requête a été faite et le code de réponse du serveur n’est pas dans
          // la plage 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          //console.log(error.response.headers);
          res
            .status(error.response.status)
            .header(error.response.headers)
            .json(error.response.data);
        } else if (error.request) {
          // la requête a été faite mais aucune réponse n’a été reçue
          // `error.request` est une instance de XMLHttpRequest dans le navigateur
          // et une instance de http.ClientRequest avec node.js
          console.log("Request", error.request);
          res.status(500).send("Error on request");
        } else {
          // quelque chose s’est passé lors de la construction de la requête et cela
          // a provoqué une erreur
          console.log("Error", error.message);
        }
      });
  })

  //Proxy backend for alchemy webhook
  .all("/alchemynotify*", (req, res) => {
    if (!AUTHTOKEN) {
      console.log("No AuthToken");
      res.status(401).json({
        message: "Unauthenticated request.",
        name: "AuthError",
      });
    } else {
      let url = "";
      let body = "";
      switch (req.params[0]) {
        case "/team-webhooks":
        case "/create-webhook":
        case "/update-webhook-addresses":
        case "/update-webhook":
          url = `https://dashboard.alchemy.com/api${req.params[0]}`;
          body = req.body;
          break;
        case "/webhook-addresses":
        case "/delete-webhook":
          url = `https://dashboard.alchemy.com/api${req.params[0]}?webhook_id=${req.query.webhook_id}`;
          break;
        default:
          console.log(`Param ${req.params[0]} in request are unkown`);
          break;
      }
      const options = {
        method: req.method,
        url: url,
        headers: {
          "alchemy-ethers-sdk-method": req.headers["alchemy-ethers-sdk-method"],
          "alchemy-ethers-sdk-version":
            req.headers["alchemy-ethers-sdk-version"],
          accept: "application/json",
          "X-Alchemy-Token": AUTHTOKEN,
        },
        data: body,
      };
      axios
        .request(options)
        .then((response) => {
          res.json(response.data);
        })
        .catch((error) => {
          if (error.response) {
            // la requête a été faite et le code de réponse du serveur n’est pas dans
            // la plage 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            //console.log(error.response.headers);
            res
              .status(error.response.status)
              .header(error.response.headers)
              .json(error.response.data);
          } else if (error.request) {
            // la requête a été faite mais aucune réponse n’a été reçue
            // `error.request` est une instance de XMLHttpRequest dans le navigateur
            // et une instance de http.ClientRequest avec node.js
            console.log(error.request);
            res.status(500).send("Error on request");
          } else {
            // quelque chose s’est passé lors de la construction de la requête et cela
            // a provoqué une erreur
            res.status(500).send(error.message);
            console.log("Error", error.message);
          }
        });
    }
  })

  //Webhook endpoint for received notification from alchemy
  .post("/alchemyhook", async (req, res) => {
    await notificationReceived(req);
    res.status(200).end();
  })

  // Remaining gets go to index.html
  .get("/*", (req, res) =>
    res.sendFile(path.join(__dirname, appDirName, "/index.html"))
  );

// Start express serveur
const server = http.createServer(app);
server.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Start the websocket server
const io = new Server(server);

// Initialise notification object
const notifications = await NotificationdStorage.init(
  io,
  "data/notifications/notifications.json"
);
console.log(
  "Pending Notifications",
  notifications.currentStoreNotifications.length
);

// Middleware for Auth
io.use((socket, next) => {
  const web3UserId = socket.handshake.auth.web3UserId;
  if (web3UserId) {
    // Existing User
    socket.web3UserId = web3UserId;
  }
  next();
});

// listen for client connections/calls on the WebSocket server
io.on("connection", (socket) => {
  console.log("Client connected " + socket.web3UserId ?? "anonymous");
  //on connection emit status server
  socket.emit(
    "status",
    JSON.stringify({
      isApiKey: APIKEY ? true : false,
      isAuthToken: AUTHTOKEN ? true : false,
    })
  );

  //on connection check pending notification
  if (notifications.currentStoreNotifications != 0) {
    // Wait 2 sec and send
    setTimeout(() => {
      notifications.sendPendingNotifications(socket.web3UserId);
      clearTimeout;
    }, 2000);
  }

  socket.on("disconnect", () =>
    console.log("Client disconnected " + socket.web3UserId ?? "anonymous")
  );

  socket.on("saveUserSettings", async (userSettings) => {
    try {
      // Save usersettings In file
      await fs.writeFile(
        `data/users/${userSettings.web3UserId}.json`,
        JSON.stringify(userSettings)
      );
      // Save Web3UserId on current socket
      socket.web3UserId = userSettings.web3UserId;
      console.log("Settings of " + userSettings.web3UserId + " saved");
    } catch (error) {
      socket.emit("error", error.message);
      console.log(error);
    }
  });

  socket.on("loadUserSettings", async (web3UserIdClient) => {
    try {
      const data = await fs.readFile(`data/users/${web3UserIdClient}.json`, {
        encoding: "utf8",
      });
      socket.emit("userSettings", JSON.parse(data));
    } catch (error) {
      socket.emit("error", error.message);
      console.log(error);
    }
  });
});

// notification received from Alchemy from the webhook. Let the clients know.
async function notificationReceived(req) {
  console.log("Notification received!");
  notifications.newNotification(req.body);
}
