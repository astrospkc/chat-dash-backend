import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/User.js";
import chatRouter from "./routes/Chat.js";
import MessageRouter from "./routes/Message.js";
import NotificationRouter from "./routes/Notificaton.js";
import { Server } from "socket.io";
import cors from "cors";

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

// const allowedOrigins = [
//   "https://chat-dash-gamma.vercel.app/",
//   // "http://localhost:5173",
// ];
const allowedOrigins = "https://chat-dash-gamma.vercel.app/";

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  console.log("hi there");
  res.send("hi there");
});

app.use("/api/chats", chatRouter);
app.use("/api/messages", MessageRouter);
app.use("/api/users", userRouter);
app.use("/api/notifications", NotificationRouter);

const server = app.listen(PORT, () => {
  console.log(`listening to the port http://localhost:${PORT}`);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
    // methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io connection logic...
io.on("connection", (socket) => {
  console.log("connected to socket.io");
  socket.on("setup", (userdata) => {
    console.log("userdata: ", userdata);
    if (userdata) {
      socket.join(userdata._id);
    }

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
