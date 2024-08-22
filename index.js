import express from "express";
import chats from "./data/data.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/User.js";
import chatRouter from "./routes/Chat.js";

import cors from "cors";
dotenv.config();
connectDB();
const app = express();
const PORT = 4000;
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
app.use("/chats", chatRouter);

app.use("/api/users", userRouter);

app.listen(PORT, () => {
  console.log(`listening to the port http://localhost:${PORT}`);
});
