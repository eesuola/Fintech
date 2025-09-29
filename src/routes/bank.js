import express, { Router } from "express";
import {
  createDeposit,
  flutterwaveWebhook,
} from "../controllers/bankController.js";
import authMiddleware from "../middleware/auth.js";
import { getWallet } from "../controllers/walletController.js";

const routes = express.Router();
/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Flutterwave webhook to update wallet on successful deposit
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               event: "charge.completed"
 *               data:
 *                 status: "successful"
 *                 amount: 1000
 *                 currency: "NGN"
 *                 tx_ref: "dep_1696000000000"
 *                 id: "FLW123456"
 *                 customer:
 *                   email: "user@example.com"
 *                   name: "John Doe"
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *       403:
 *         description: Invalid signature
 */
routes.post("/deposit", authMiddleware, createDeposit);
/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Flutterwave webhook to update user wallet on successful payment
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               event: "charge.completed"
 *               data:
 *                 status: "successful"
 *                 amount: 1000
 *                 currency: "NGN"
 *                 tx_ref: "dep_1696000000000"
 *                 id: "FLW123456"
 *                 customer:
 *                   email: "user@example.com"
 *                   name: "John Doe"
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *       403:
 *         description: Invalid signature
 *       500:
 *         description: Internal server error
 */
routes.post("/webhook", flutterwaveWebhook);

/**
 * @openapi
 * /bank/deposit/callback:
 *   get:
 *     tags:
 *       - Bank
 *     summary: Deposit callback redirect
 *     description: Redirect page after Flutterwave payment
 *     responses:
 *       200:
 *         description: Redirect success message
 */
// Add this callback route for Flutterwave redirect




export default routes;
