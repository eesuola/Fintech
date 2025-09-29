import {
  deposit,
  createWallet,
  getWallet,
  withdraw,
  getTransactions,
} from "../controllers/walletController.js";

import express from "express";
import authMiddleware from "../middleware/auth.js";

const walletRoutes = express.Router();
walletRoutes.post("/deposit", authMiddleware, deposit);
walletRoutes.post("/withdraw", authMiddleware, withdraw);

walletRoutes.get("/balance", authMiddleware, getWallet);
walletRoutes.get("/transactions", authMiddleware, getTransactions);
walletRoutes.post("/create", authMiddleware, createWallet);

export default walletRoutes;
