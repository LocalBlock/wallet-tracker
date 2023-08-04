// const express = require('express')
// const path = require('path')

// const { Server } = require('socket.io');
const PORT = 5000
// const fetch = require('node-fetch');

// // start the express server with the appropriate routes for our webhook and web requests
// // var app = express()
// //   .use(express.static(path.join(__dirname, 'public')))
// //   .use(express.json())
// //   .post('/alchemyhook', (req, res) => { notificationReceived(req); res.status(200).end() })
// //   .get('/*', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))
// //   .listen(PORT, () => console.log(`Listening on ${PORT}`))

const express = require("express");

const app = express()
  .use(express.json())
  .post("/alchemyhook", (req, res) => {
    notificationReceived(req);
    res.status(200).end();
  });
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

server.listen(PORT,() => console.log(`Listening on ${PORT}`))

// start the websocket server
//const io = socketIO(app);
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
