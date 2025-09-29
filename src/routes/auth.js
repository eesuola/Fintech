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
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phoneNumber
 *               - password
 *               - country
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing or invalid fields
 *       409:
 *         description: User already exists
 */

routes.post("/register", loginLimiter, registration);
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user with email or phone number
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Invalid credentials
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
/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout the user
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
routes.post("/logout", authMiddleware, getAllNigerianUsers);

export default routes;
