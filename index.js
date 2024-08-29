import express from "express";
import chats from "./data/data.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/User.js";
import chatRouter from "./routes/Chat.js";
import MessageRouter from "./routes/Message.js";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
dotenv.config();
connectDB();
const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  console.log("hi there");
  res.send("hi there");
});

// app.get("/api/chats", (req, res) => {
//   res.send(chats);
// });

// app.get("/api/chats/:id", (req, res) => {
//   const user = chats.find((chat) => chat._id == req.params.id);
//   res.send(user);
// });
app.use("/api/chats", chatRouter);
app.use("/api/messages", MessageRouter);

app.use("/api/users", userRouter);

const server = app.listen(PORT, () => {
  console.log(`listening to the port http://localhost:${PORT}`);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");
  socket.on("setup", (userdata) => {
    console.log("userdata: ", userdata);
    socket.join(userdata._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("user connected room ", room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat.users) {
      return "chat.users not defined";
    }
    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message received", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("user disconnected");
    socket.leave(userdata._id);
  });
});
