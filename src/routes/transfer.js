import express from "express";
import {
  transferFund,
} from "../controllers/transferController.js";
import authMiddleware from "../middleware/auth.js";


const routes = express.Router();
routes.post("/", authMiddleware, transferFund);

export default routes;
