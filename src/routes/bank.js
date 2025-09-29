import express, { Router } from "express";
import {
  createDeposit,
  flutterwaveWebhook,
} from "../controllers/bankController.js";
import authMiddleware from "../middleware/auth.js";
import { getWallet } from "../controllers/walletController.js";

const routes = express.Router();
routes.get("/wallet", authMiddleware, getWallet);
routes.post("/deposit", authMiddleware, createDeposit);
routes.post("/webhook", flutterwaveWebhook);


export default routes;
