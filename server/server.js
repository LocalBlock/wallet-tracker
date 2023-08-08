const express = require("express");
const compression = require('compression')
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
// const fetch = require('node-fetch');

const appDirName = "/app";
const PORT = 3000;

console.log(__dirname, process.env.NODE_ENV);

// // Express server with the appropriate routes for our webhook and web requests
const app = express()
  .use(express.static(path.join(__dirname, appDirName))) //Serve static files
  .use(express.json())
  .use(compression()) //gzip compression
  .get("/*", (req, res) =>
    res.sendFile(path.join(__dirname, appDirName, "/index.html"))
  )
  .post("/alchemyhook", (req, res) => {
    notificationReceived(req);
    res.status(200).end();
  });

// Start express serveur
const server = http.createServer(app);
server.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Start the websocket server
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

// listen for client connections/calls on the WebSocket server
io.on("connection", (socket) => {
  console.log("Client connected");
  //socket.emit("connect")
  socket.on("disconnect", () => console.log("Client disconnected"));
  //   socket.on("register address", (msg) => {
  //     //send address to Alchemy to add to notification
  //     addAddress(msg);
  //   });
});

// notification received from Alchemy from the webhook. Let the clients know.
function notificationReceived(req) {
  console.log("notification received!");
  io.emit("notification", JSON.stringify(req.body));
}

// // add an address to a notification in Alchemy
// async function addAddress(new_address) {
//   console.log("adding address " + new_address);
//   const body = {
//     webhook_id: "<your alchemy webhook id>",
//     addresses_to_add: [new_address],
//     addresses_to_remove: [],
//   };
//   try {
//     fetch("https://dashboard.alchemyapi.io/api/update-webhook-addresses", {
//       method: "PATCH",
//       body: JSON.stringify(body),
//       headers: { "Content-Type": "application/json" },
//       headers: { "X-Alchemy-Token": "<your alchemy token>" },
//     })
//       .then((res) => res.json())
//       .then((json) => console.log(json));
//   } catch (err) {
//     console.error(err);
//   }
// }
