import express from "express";
import {
  createDeposit,
  flutterwaveWebhook,
} from "../controllers/bankController.js";
import authMiddleware from "../middleware/auth.js";

const routes = express.Router();

/**
 * @openapi
 * /bank/deposit:
 *   post:
 *     tags:
 *       - Bank
 *     summary: Initiate deposit via Flutterwave
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit initialized
 */
routes.post("/deposit", authMiddleware, createDeposit);

/**
 * @openapi
 * /bank/webhook:
 *   post:
 *     tags:
 *       - Webhook
 *     summary: Flutterwave Webhook
 *     description: Called by Flutterwave to confirm transactions
 *     responses:
 *       200:
 *         description: Webhook received
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
routes.get("/deposit/callback", (req, res) => {
  res.send(
    "Payment completed! You can now close this window or return to the app."
  );
});

export default routes;
