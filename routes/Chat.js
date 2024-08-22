import express from "express";
import fetchUser from "../middleware/fetchUser.js";
import User from "../models/User.js";
import Chat from "../models/Chat.js";

const router = express.Router();

const accessChats = async (req, res, next) => {
  const { userId } = req.body;

  try {
    console.log("userId: ", userId, "req.user: ", req.user.user);

    // Check if the chat already exists
    const isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user.user } } },
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
      console.log("ischat[0]: ", isChat[0]);
      return res.status(200).json({ success: true, chat: isChat[0] });
    }

    // If no chat exists, create a new chat
    const chatData = {
      chatName: "sender", // You can make this dynamic if needed
      isGroupChat: false,
      users: [req.user.user, userId],
    };

    const createChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createChat._id }).populate(
      "users",
      "-password"
    );

    return res.status(201).json({ success: true, chat: fullChat });
  } catch (error) {
    console.error("Error accessing chats:", error);
    return next(error); // Pass the error to the next middleware
  }
};

const fetchChats = async (req, res) => {
  try {
    const chat = await Chat.find({
      users: { $elemMatch: { $eq: req.user.user } },
    });
    console.log("chat: ", chat);
    res.send(chat);
  } catch (error) {
    throw new Error(error);
  }
};

router.post("/", fetchUser, accessChats);
router.get("/access", fetchUser, fetchChats);

export default router;
