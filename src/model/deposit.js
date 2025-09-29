import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
  tx_ref: { type: String, required: true, unique: true }, // Flutterwave transaction reference
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, default: "Pending" }, // Pending, Successful, Failed
  flw_id: { type: String, required: true }, // Flutterwave transaction ID
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Deposit", depositSchema);
