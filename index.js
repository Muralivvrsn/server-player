// importing required librarires
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const uuid = require("uuid");
const app = express();
const server = http.createServer(app);

//creating a socket server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

//initializing an object of rooms
const port = process.env.PORT || 4000;
const MAX_USERS = 4;
let usersInRoom = {};

//middlewares
app.use(cors());
app.use(express.json());

//socket connections
io.on("connection", (socket) => {
  socket.on("create-room", () => {
    const id = uuid.v4(); //creating an id
    usersInRoom[id] = []; //  initializing room array
    socket.emit("room-id", {
      //sending room id to client
      id,
    });
  });

  socket.on("join-room", (data) => {
    if (!usersInRoom[data.room]) {
      socket.emit("No-room");
      return;
    }

    const number_of_users = usersInRoom[data.room].length;
    if (number_of_users >= MAX_USERS) {
      socket.emit("room-full"); // if not emit the room-full
      return;
    }

    socket.handshake.query.room = data.room; //save the room id in the your socket query
    const user = { id: socket.id, name: data.name };

    socket.join(data.room);
    usersInRoom[data.room].push(user); //push the new user into the object

    io.to(data.room).emit("joined", {
      user,
      users: usersInRoom[data.room],
    }); //sending the data to the room
  });
  

  socket.on("disconnect", () => {
    const id = socket.handshake.query.room;
    if (!usersInRoom[id]) {
      return;
    }
    const user = usersInRoom[id].find((user) => user.id === socket.id);
    usersInRoom[id] = usersInRoom[id].filter((item) => item.id !== socket.id);
    console.log(usersInRoom[id]);
    io.to(id).emit("player-out", { user, users: usersInRoom[id] });
  });
});

//listeing to server
server.listen(port, () => {
  console.log("Server listening on port 4000");
});
