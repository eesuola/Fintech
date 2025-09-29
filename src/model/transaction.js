import mongoose from "mongoose";

const { Schema } = mongoose;

const TransactionSchema = new Schema({
  type: {
    type: String,
    enum: ["deposit", "withdraw", "transfer"],
    required: true,
  },
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  debitCurrency: String,
  creditCurrency: String,
  creditAmount: Number,
  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: "pending",
  },
  tx_ref: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;
