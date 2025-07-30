import mongoose from 'mongoose';

const { Schema } = mongoose;

const TransactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['Deposit', 'Transfer', 'Withdraw'],
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;
