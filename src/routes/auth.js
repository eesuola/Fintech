import express from "express";
import {
  registration,
  login,
  deleteAllUsers,
  getAllUsers,
  getAllNigerianUsers,
} from "../controllers/authController.js";
import rateLimit from "express-rate-limit";
import { logLoginAttempt } from "../middleware/loginLogger.js";
import authMiddleware from "../middleware/auth.js";

// Limit login attempts to 5 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit registration attempts similarly
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Too many accounts created from this IP, please try again later",
});

const routes = express.Router();
routes.post("/register", loginLimiter, registration);
routes.post("/login", registerLimiter, logLoginAttempt, login);
routes.delete("/deleteAll", deleteAllUsers);
routes.get("/getAllUsers", authMiddleware, getAllUsers);
routes.get("/getAllNigerianUsers", authMiddleware, getAllNigerianUsers);
routes.post("/logout", authMiddleware, getAllNigerianUsers);

export default routes;
