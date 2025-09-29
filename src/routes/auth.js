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

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - phoneNumber
 *               - country
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       201:
 *         description: User registered successfully
 */
routes.post("/register", loginLimiter, registration);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
routes.post("/login", registerLimiter, logLoginAttempt, login);

/**
 * @openapi
 * /auth/deleteAll:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete all users (Admin only)
 *     responses:
 *       200:
 *         description: All users deleted
 */
routes.delete("/deleteAll", deleteAllUsers);
/**
 * @openapi
 * /auth/getAllUsers:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
routes.get("/getAllUsers", authMiddleware, getAllUsers);

/**
 * @openapi
 * /auth/getAllNigerianUsers:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get Nigerian users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Nigerian users
 */
routes.get("/getAllNigerianUsers", authMiddleware, getAllNigerianUsers);
routes.post("/logout", authMiddleware, getAllNigerianUsers);

export default routes;
