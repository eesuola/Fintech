import express from "express";
import {
  transferFund,
} from "../controllers/transferController.js";
import authMiddleware from "../middleware/auth.js";


const routes = express.Router();
/**
 * @swagger
 * /wallet/transfer:
 *  post:
 *    summary: Transfer funds to another user
 *    tags:
 *      - Wallet
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              recipientIdentifier:
 *                type: string
 *                description: Email or phone number of recipient
 *                example: jane@example.com
 *              amount:
 *                type: number
 *                example: 500
 *              currency:
 *                type: string
 *                example: NGN
 *    responses:
 *      200:
 *        description: Transfer successful
 *      400:
 *        description: Insufficient balance or invalid recipient
 */
routes.post("/", authMiddleware, transferFund);

export default routes;
