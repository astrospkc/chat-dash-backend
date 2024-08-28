import express from "express";
import fetchUser from "../middleware/fetchUser.js";
import User from "../models/User.js";

import mongoose from "mongoose";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

const router = express.Router();

const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    res.status(400).send("all the fields are required");
  }

  var newMessage = {
    chat: chatId,
    content: content,
    sender: req.user._id,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    throw new Error(error.message);
  }
};

const allMessage = async (req, res) => {
  try {
    const message = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

router.post("/sendMessage", fetchUser, sendMessage);
router.get("/allMessage/:chatId", fetchUser, allMessage);

export default router;
