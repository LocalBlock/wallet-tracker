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
import { SiweErrorType, generateNonce, SiweMessage } from "siwe";
import session from "express-session";
import fileStore from "session-file-store";
const FileStoreStore = fileStore(session);

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
const PROJECTID = process.env.VITE_WALLETCONNECT_PROJECTID;

// Initialise data directory
try {
  // Create directory if not exist
  await fs.mkdir("data/users", { recursive: true });
} catch (error) {
  console.log(error);
}

console.log("Alchemy :", "APIKEY=" + APIKEY, "AUTHTOKEN=" + AUTHTOKEN);
console.log("WalletConnnet :", "ProjetId=" + PROJECTID);

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
  .use(
    session({
      name: "siwe",
      secret: "super secret",
      resave: true,
      saveUninitialized: true,
      store: new FileStoreStore({ path: "data/sessions" }),
      cookie: {
        httpOnly: true,
        maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
        secure: process.env.NODE_ENV === "production",
      },
    })
  )
  .get("/status", (req, res) => {
    res.status(200).json({
      isApiKey: APIKEY ? true : false,
      isAuthToken: AUTHTOKEN ? true : false,
      projectId: PROJECTID,
    });
  })
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

  // Sign in ethereum
  .get("/siwe/nonce", async (req, res) => {
    req.session.nonce = generateNonce();
    req.session.save(() => res.status(200).send(req.session.nonce).end());
  })
  .get("/siwe/me", async (req, res) => {
    if (!req.session.siwe) {
      res.status(200).json({ address: "" });
      return;
    }
    res
      .status(200)
      .json({
        //text: getText(req.session.siwe.address),
        address: req.session.siwe.address,
        //ens: req.session.ens,
      })
      .end();
  })
  // Verify siwe, log in, and send userSettings
  .post("/siwe/verify", async (req, res) => {
    if (!req.body.message) {
      res.status(422).json({ message: "Expected signMessage object as body." });
      return;
    }
    try {
      const { message, signature } = req.body;
      //Create siweMessage from request
      const siweMessage = new SiweMessage(message);
      // Verify signature
      const { data: fields } = await siweMessage.verify({
        signature,
        nonce: req.session.nonce,
      });
      req.session.siwe = fields;
      req.session.save();
      //Check if user settings exist and send to response
      try {
        const userSettings = await fs.readFile(
          `data/users/${fields.address}.json`,
          {
            encoding: "utf8",
          }
        );
        res.json({ userSettings: JSON.parse(userSettings) });
      } catch (error) {
        //file not exist
        res.json({ userSettings: undefined });
      }
    } catch (error) {
      req.session.siwe = null;
      req.session.nonce = null;
      console.log(error);
      switch (error) {
        case SiweErrorType.EXPIRED_MESSAGE: {
          req.session.save(() =>
            res.status(440).json({ message: error.message })
          );
          break;
        }
        case SiweErrorType.INVALID_SIGNATURE: {
          req.session.save(() =>
            res.status(422).json({ message: error.message })
          );
          break;
        }
        default: {
          req.session.save(() =>
            res.status(500).json({ message: error.message })
          );
          break;
        }
      }
    }
  })
  .get("/siwe/logout", async (req, res) => {
    if (!req.session.siwe) {
      res.status(401).json({ message: "You have to first sign_in" });
      return;
    }
    console.log("Logout " + req.session.siwe.address);
    req.session.destroy(() => {
      res.clearCookie("siwe").status(205).send();
    });
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
  const connectedUser = socket.handshake.auth.connectedUser;
  if (connectedUser) {
    // Existing User
    socket.connectedUser = connectedUser;
  }
  next();
});

// listen for client connections/calls on the WebSocket server
io.on("connection", (socket) => {
  console.log("Client connected " + socket.connectedUser ?? "anonymous");

  //on connection check pending notification
  if (notifications.currentStoreNotifications != 0) {
    // Wait 2 sec and send
    setTimeout(() => {
      notifications.sendPendingNotifications(socket.connectedUser);
      clearTimeout;
    }, 2000);
  }

  socket.on("disconnect", () =>
    console.log("Client disconnected " + socket.connectedUser ?? "anonymous")
  );

  socket.on("saveUserSettings", async (userSettings) => {
    try {
      // Save usersettings In file
      await fs.writeFile(
        `data/users/${socket.connectedUser}.json`,
        JSON.stringify(userSettings)
      );
      console.log("Settings of " + socket.connectedUser + " saved");
    } catch (error) {
      socket.emit("error", error.message);
      console.log(error);
    }
  });

  // Add connectedUser on current socket, use when initialy the current socket is not attach to a user
  socket.on("updateSocketAuth", (connectedUser) => {
    socket.connectedUser = connectedUser;
  });
});

// notification received from Alchemy from the webhook. Let the clients know.
async function notificationReceived(req) {
  console.log("Notification received!");
  notifications.newNotification(req.body);
}
