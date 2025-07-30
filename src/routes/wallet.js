import {
  deposit,
  getWallet,
  withdraw,
  transfer,
  getTransactions,
  convertCurrency,
} from '../controllers/walletController.js';

import express from 'express';
import authMiddleware from '../middleware/auth.js';

const walletRoutes = express.Router();

walletRoutes.post('/top-up', authMiddleware, deposit);
walletRoutes.post('/withdraw', authMiddleware, withdraw);
walletRoutes.get('/balance', authMiddleware, getWallet);
walletRoutes.post('/transfer', authMiddleware, transfer);
walletRoutes.get('/transactions', authMiddleware, getTransactions);
walletRoutes.post('/convert', authMiddleware, convertCurrency);

export default walletRoutes;
