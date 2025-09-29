import User from "../model/user.js";
import Transaction from "../model/transaction.js";
import Wallet from "../model/wallet.js";

export const deposit = async (req, res) => {
  const { currency, amount } = req.body;
  if (!currency || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid Currency or amount" });
  }
  try {
    const user = await User.findById(req.userId);
    console.log("User found:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const wallet = user.wallets.find((w) => w.currency === currency);
    if (wallet) {
      wallet.balance += amount;
    } else {
      user.wallets.push({ currency, balance: amount });
    }
    await user.save();

    //Transactions
    await Transaction.create({
      user: user._id,
      type: "Deposit",
      currency,
      amount,
      description: "Deposit",
    });
    res
      .status(200)
      .json({ message: `Deposited ${amount} ${currency} successfully` });
  } catch (error) {
    console.error("Error depositing to wallet:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const withdraw = async (req, res) => {
  const { currency, amount } = req.body;
  if (!currency || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid Currency or amount" });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const wallet = user.wallets.find((w) => w.currency === currency);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    wallet.balance -= amount;
    await user.save();

    //Transactions
    await Transaction.create({
      user: user._id,
      type: "Withdraw",
      currency,
      amount,
      description: "Withdraw",
    });
    res
      .status(200)
      .json({ message: `Withdrew ${amount} ${currency} successfully` });
  } catch (error) {
    console.error("Error withdrawing from wallet:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getWallet = async (req, res) => {
  try {
    const userId = req.userId;
    const wallets = await Wallet.find({ userId });
    res.status(200).json({ wallets }); // Wrap in { wallets: [...] }
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
};
export const createWallet = async (req, res) => {
  try {
    const { currency } = req.body;
    const userId = req.userId; // From authMiddleware

    if (!currency) {
      return res.status(400).json({ error: "Currency is required" });
    }

    const existingWallet = await Wallet.findOne({ userId, currency });
    if (existingWallet) {
      return res
        .status(400)
        .json({ error: "Wallet for this currency already exists" });
    }

    const wallet = new Wallet({ userId, currency, balance: 0 });
    await wallet.save();

    res.status(201).json({ message: "Wallet created", wallet });
  } catch (error) {
    console.error("Error creating wallet:", error);
    res.status(500).json({ error: "Failed to create wallet" });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, currency } = req.query;
    const query = { user: req.userId };

    if (type) query.type = type; // e.g., 'Deposit', 'Withdraw', 'Transfer'
    if (status) query.status = status; // e.g., 'Pending', 'Completed
    if (currency) query.currency = currency; // e.g., 'USD', 'NGN'
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments(query);
    res.status(200).json({
      success: true,
      transactions,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

