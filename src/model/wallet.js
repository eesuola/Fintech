import mongoose from 'mongoose';


const { Schema } = mongoose;

const WalletSchema = new Schema({
    balance: { type: Number, default: 0 },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
  },
  { timestamps: true }
)

const Wallet = mongoose.model('Wallet', WalletSchema);

export default Wallet;