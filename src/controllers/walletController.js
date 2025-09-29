import User from '../model/user.js';
import Transaction from '../model/transaction.js';
import Wallet from '../model/wallet.js';
import axios from 'axios';

export const deposit = async (req, res) => {
  const { currency, amount } = req.body;
  if (!currency || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid Currency or amount' });
  }
  try {
    const user = await User.findById(req.userId);
    console.log('User found:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
      type: 'Deposit',
      currency,
      amount,
      description: 'Deposit',
    });
    res
      .status(200)
      .json({ message: `Deposited ${amount} ${currency} successfully` });
  } catch (error) {
    console.error('Error depositing to wallet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const withdraw = async (req, res) => {
  const { currency, amount } = req.body;
  if (!currency || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid Currency or amount' });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const wallet = user.wallets.find((w) => w.currency === currency);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    wallet.balance -= amount;
    await user.save();

    //Transactions
    await Transaction.create({
      user: user._id,
      type: 'Withdraw',
      currency,
      amount,
      description: 'Withdraw',
    });
    res
      .status(200)
      .json({ message: `Withdrew ${amount} ${currency} successfully` });
  } catch (error) {
    console.error('Error withdrawing from wallet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const transfer = async (req, res) => {
  const { receiverEmail, fromCurrency, toCurrency, amount } = req.body;

  if (!receiverEmail || !fromCurrency || !toCurrency || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Please provide valid transfer details' });
  }

  try {
    const sender = await User.findById(req.userId);
    const receiver = await User.findOne({ email: receiverEmail });

    if (!sender) return res.status(404).json({ message: 'Sender not found' });
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    const senderWallet = sender.wallets.find(w => w.currency === fromCurrency);
    if (!senderWallet) {
      return res.status(400).json({ message: 'Sender wallet not found' });
    }

    // Calculate charge
    const chargeRate = 0.01; // 1%
    const charge = amount * chargeRate;
    const totalDeduct = amount + charge;

    if (senderWallet.balance < totalDeduct) {
      return res.status(400).json({ message: 'Insufficient balance (including charges)' });
    }

    let convertedAmount = amount;

    // Currency conversion if needed
    if (fromCurrency !== toCurrency) {
      const apiKey = process.env.EXCHANGE_API_KEY;
      const apiUrl = `https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}&access_key=${apiKey}`;
      const { data } = await axios.get(apiUrl);
      if (!data || !data.result) {
        return res.status(500).json({ message: 'Conversion failed. Try again.' });
      }
      convertedAmount = data.result;
    }

    // Deduct from sender
    senderWallet.balance -= totalDeduct;

    // Add to receiver
    let receiverWallet = receiver.wallets.find(w => w.currency === toCurrency);
    if (receiverWallet) {
      receiverWallet.balance += convertedAmount;
    } else {
      receiver.wallets.push({ currency: toCurrency, balance: convertedAmount });
    }

    await sender.save();
    await receiver.save();

    // Record transactions for both users
    await Transaction.create([
      {
        user: sender._id,
        type: 'Transfer',
        currency: fromCurrency,
        amount,
        toUser: receiver._id,
        description: `Transfer to ${receiver.email} (${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}), charge: ${charge}`,
      },
      {
        user: receiver._id,
        type: 'Deposit',
        currency: toCurrency,
        amount: convertedAmount,
        toUser: sender._id,
        description: `Received from ${sender.email} (${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency})`,
      },
    ]);

    res.json({
      message: 'Transfer successful',
      from: fromCurrency,
      to: toCurrency,
      convertedAmount,
      charge,
      senderNewBalance: sender.wallets.reduce((acc, w) => {
        acc[w.currency] = w.balance;
        return acc;
      }, {}),
      receiverNewBalance: receiver.wallets.reduce((acc, w) => {
        acc[w.currency] = w.balance;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error('Transfer error:', err.message);
    res.status(500).json({ message: 'Server error during transfer', error: err.message });
  }
};

export const getWallet = async (req, res) => {
  try {
    const userId = req.userId;
    const wallets = await Wallet.find({ userId });
    res.status(200).json({ wallets }); // Wrap in { wallets: [...] }
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};
export const createWallet = async (req, res) => {
  try {
    const { currency } = req.body;
    const userId = req.userId; // From authMiddleware

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    const existingWallet = await Wallet.findOne({ userId, currency });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet for this currency already exists' });
    }

    const wallet = new Wallet({ userId, currency, balance: 0 });
    await wallet.save();

    res.status(201).json({ message: 'Wallet created', wallet });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
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
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const convertCurrency = async (req, res) => {
  const { fromCurrency, toCurrency, amount } = req.body;
  if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (fromCurrency === toCurrency) {
    return res
      .status(400)
      .json({ message: 'Cannot convert the same currency' });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fromWallet = user.wallets.find((w) => w.currency === fromCurrency);
    if (!fromWallet || fromWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    const apiKey = process.env.EXCHANGE_API_KEY; // Store your key in .env
    const apiUrl = `https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}&access_key=${apiKey}`;
    const { data } = await axios.get(apiUrl);
    console.log('Exchange API response:', data);

    if (!data || typeof data.result !== 'number') {
      return res
        .status(500)
        .json({ message: 'Failed to fetch conversion rate' });
    }

    const convertedAmount = amount * data.result;
    const rateUsed = convertedAmount / amount;
    fromWallet.balance -= amount;

    let toWallet = user.wallets.find((w) => w.currency === toCurrency);
    if (toWallet) {
      toWallet.balance += convertedAmount;
    } else {
      user.wallets.push({ currency: toCurrency, balance: convertedAmount });
    }
    await user.save();
    res.status(200).json({
      message: `Conversion successful`,
      from: fromCurrency,
      to: toCurrency,
      rateUsed,
      convertedAmount,
      newBalance: user.wallets.reduce((acc, w) => {
        acc[w.currency] = w.balance;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
