import express from "express";
import { createDeposit, flutterwaveWebhook } from "../controllers/bank.controller.js";
import authMiddleware from "../middleware/auth.js";

const routes = express.Router();

routes.post("/deposit", authMiddleware, createDeposit);
routes.post("/webhook", flutterwaveWebhook);

export default routes;
