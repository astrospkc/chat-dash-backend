import express from "express";
import fetchUser from "../middleware/fetchUser.js";
import Notification from "../models/Notification.js";

const router = express.Router();

const createNotificaton = async (req, res) => {
  try {
    const { userId } = req.user;
    const { senderId, chatId, msg_content } = req.body;
    if (!senderId || !chatId || !msg_content) {
      res.status(400).send("all the fields are required");
    }

    const notification = await Notification.create({
      user_id: userId,
      sender_id: senderId,
      chat_id: chatId,
      msg_content: msg_content,
    }).populate("user_id", "name pic");

    const data = notification;
    console.log("data: ", data);
    return res.status(200).send(notification);
  } catch (error) {
    return error;
  }
};

const getNotification = () => {};
const getUnreadNotification = () => {};
const markAsRead = () => {};

const deleteNotification = () => {};
const deleteAllNotification = () => {};
const updateNotification = () => {};
const countNotification = () => {};
router.post("/post", fetchUser, createNotificaton);
export default router;
