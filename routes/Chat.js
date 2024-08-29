import express from "express";
import fetchUser from "../middleware/fetchUser.js";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import mongoose from "mongoose";

const router = express.Router();

const accessChats = async (req, res, next) => {
  const { userId } = req.body;

  try {
    // console.log("req.user: ", req.user);
    // console.log("userId: ", userId, "req.user: ", req.user._id);

    // Check if the chat already exists
    const isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    // Populate the latestMessage with sender details
    await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    if (isChat.length > 0) {
      // console.log("ischat[0]: ", isChat[0]);
      return res.status(200).json({ success: true, chat: isChat[0] });
    }

    // If no chat exists, create a new chat
    const chatData = {
      chatName: "sender", // You can make this dynamic if needed
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    const createChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createChat._id }).populate(
      "users",
      "-password"
    );
    // console.log("fullChat: ", fullChat);

    return res.status(201).json({ chat: fullChat });
  } catch (error) {
    // console.error("Error accessing chats:", error);
    return next(error); // Pass the error to the next middleware
  }
};

const fetchChats = async (req, res) => {
  try {
    const chat = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const results = await User.populate(chat, {
      path: "latestMessage.sender",
      select: "name, pic, email",
    });

    // console.log("chat: ", results);
    res.status(200).send(results);
  } catch (error) {
    throw new Error(error);
  }
};

const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.chatName) {
    res.status(400).send("Please fill all the fields");
  }
  var users = JSON.parse(req.body.users);
  if (users.length < 2) {
    res.status(400).send("more than 2 users are required for the group chat");
  }
  // console.log("req.user:", req.user);
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.chatName,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupchat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupchat);
  } catch (error) {
    console.log("error: ", error);
    throw new Error(error);
  }
};

const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;
  const updatedName = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!updatedName) {
    res.status(404);
    throw new Error("chat not found while renaming the group");
  } else {
    res.status(200).send(updatedName);
  }
};

// adding member to the group
const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("chat not found while adding member to the group");
  } else {
    res.status(200).send(added);
  }
};

const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("chat not found while removing member from the group");
  } else {
    res.status(200).send(removed);
  }
};

router.post("/", fetchUser, accessChats);
router.get("/fetchChat", fetchUser, fetchChats);
router.post("/group/creategroup", fetchUser, createGroupChat);
router.put("/group/renamegroup", fetchUser, renameGroup);
router.put("/group/addMember", fetchUser, addToGroup);
router.put("/group/removeMember", fetchUser, removeFromGroup);

export default router;
