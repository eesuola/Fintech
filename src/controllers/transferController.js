import User from "../model/user.js";
import Transaction from "../model/transaction.js";
import { getExchangeRate } from "../utils/exchange.js";

export const transferFund = async (req, res) => {
  try {
    const { recipientEmail, amount, currency } = req.body;

    if (!recipientEmail || !amount || amount <= 0 || !currency) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find sender and recipient
    const sender = await User.findById(req.userId);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!sender) return res.status(404).json({ message: "Sender not found" });
    if (!recipient)
      return res.status(404).json({ message: "Recipient not found" });

    // Get sender wallet
    let senderWallet = sender.wallets.find((w) => w.currency === currency);
    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Get recipient wallet (can be in same or different currency)
    let recipientWallet = recipient.wallets.find(
      (w) => w.currency === currency
    );

    let creditAmount = amount;
    let recipientCurrency = currency;

    // If recipient has no wallet in sender’s currency, convert
    if (!recipientWallet) {
      recipientCurrency = recipient.countryCurrency
      const rate = await getExchangeRate(currency, recipientCurrency);

      if (!rate) {
        return res.status(400).json({ message: "FX conversion not available" });
      }

      creditAmount = amount * rate;

      // Add a new wallet for recipient
      recipient.wallets.push({
        currency: recipientCurrency,
        balance: creditAmount,
      });
    } else {
      // Same-currency transfer
      recipientWallet.balance += amount;
    }

    // Deduct from sender
    senderWallet.balance -= amount;

    // Save both users atomically
    await sender.save();
    await recipient.save();

    // Log the transfer
    const tx = new Transaction({
      type: "transfer",
      from: sender._id,
      to: recipient._id,
      amount,
      debitCurrency: currency,
      creditCurrency: recipientCurrency,
      creditAmount,
      status: "successful",
      tx_ref: `trf_${Date.now()}`,
    });
    await tx.save();

    return res.status(200).json({
      message: "Transfer successful",
      transfer: {
        from: sender.email,
        to: recipient.email,
        amount,
        debitCurrency: currency,
        creditAmount,
        creditCurrency: recipientCurrency,
        tx_ref: tx.tx_ref,
      },
    });
  } catch (error) {
    console.error("Transfer error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
