import express from "express";
import { createDeposit, flutterwaveWebhook } from "../controllers/bank.controller.js";
import authMiddleware from "../middleware/auth.js";

const routes = express.Router();

routes.post("/deposit", authMiddleware, createDeposit);
routes.post("/webhook", flutterwaveWebhook);

// Add this callback route for Flutterwave redirect
routes.get("/deposit/callback", (req, res) => {
  res.send("Payment completed! You can now close this window or return to the app.");
});

export default routes;
