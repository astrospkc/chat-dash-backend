import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import express from "express";

const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("token ", token);

  try {
    if (!token) {
      res.status(401).send("Please login first with valid credentials");
    }
    const data = jwt.verify(token, JWT_SECRET);
    console.log("data: ", data);
    console.log("data.user ", data.user._id);
    req.user = data.user;
    console.log("req.user: ", req.user._id);
    next();
  } catch (error) {
    console.log("error: ", error);
    res.status(401).send("valid token please");
  }
};

export default fetchUser;
