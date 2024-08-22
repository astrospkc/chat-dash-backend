import express from "express";
import fetchUser from "../middleware/fetchUser.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Import the jwt library

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Get the JWT secret from environment variables

// Register route
const registerUser = async (req, res) => {
  console.log("req.body : ", req.body);
  try {
    const { name, username, email, password, pic } = req.body;

    // Check if all required fields are provided
    if (!name || !username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      email,
      pic,
    });

    // Generate a JWT token
    const data = {
      user: {
        id: user._id,
      },
    };
    const authToken = jwt.sign(data, JWT_SECRET, { expiresIn: "1h" }); // Set the expiration time (e.g., 1 hour)

    // Send the response with success, authToken, and user data
    res.status(201).json({ success: true, authToken, user });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// login the user
// type the username and password
// password verification
const loginUser = async (req, res) => {
  let success = false;
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.send("all the fields are required , username and password");
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.send("please provide the correct username");
    } else {
      const comparePassword = await bcrypt.compare(password, user.password);
      if (!comparePassword) {
        res.send("please provide the correct password");
      }

      const data = {
        user: {
          user: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.send({ success, authtoken });
    }
  } catch (error) {
    console.log("error while login: ", error);
    res.status(500).send("Internal server error");
  }
};

// search result
// //api/user?search=john
const searchUser = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
  } catch (error) {}
};

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", fetchUser, searchUser);

export default router;
