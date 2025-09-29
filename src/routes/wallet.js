import {
  deposit,
  createWallet,
  getWallet,
  withdraw,
  transfer,
  getTransactions,
  convertCurrency,
} from "../controllers/walletController.js";

import express from "express";
import authMiddleware from "../middleware/auth.js";

const walletRoutes = express.Router();

/**
 * @openapi
 * /wallet/deposit:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Deposit into wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit successful
 */
walletRoutes.post("/deposit", authMiddleware, deposit);

/**
 * @openapi
 * /wallet/withdraw:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Withdraw from wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal successful
 */
walletRoutes.post("/withdraw", authMiddleware, withdraw);

/**
 * @openapi
 * /wallet/balance:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance retrieved
 */
walletRoutes.get("/balance", authMiddleware, getWallet);
/**
 * @openapi
 * /wallet/transfer:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Transfer funds between wallets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transfer successful
 */
walletRoutes.post("/transfer", authMiddleware, transfer);
/**
 * @openapi
 * /wallet/transactions:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */
walletRoutes.get("/transactions", authMiddleware, getTransactions);

/**
 * @openapi
 * /wallet/convert:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Convert currency
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversion successful
 */
walletRoutes.post("/convert", authMiddleware, convertCurrency);
/**
 * @openapi
 * /wallet/create:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Create a new wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Wallet created
 */
walletRoutes.post("/create", authMiddleware, createWallet);

export default walletRoutes;
