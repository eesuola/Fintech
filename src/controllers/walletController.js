import User from '../model/user.js';
import Transaction from '../model/transaction.js';
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
  const { toEmail, currency, amount } = req.body;
  if (!toEmail || !currency || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  try {
    const fromUser = await User.findById(req.userId);
    const toUser = await User.findOne({ email: toEmail.toLowerCase() });
    if (!fromUser || !toUser)
      return res.status(404).json({ message: 'User not found' });

    const fromWallet = fromUser.wallets.find((w) => w.currency === currency);
    if (!fromWallet || fromWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    let toWallet = toUser.wallets.find((w) => w.currency === currency);
    if (toWallet) {
      toWallet.balance += amount;
    } else {
      toWallet = { currency, balance: amount };
      toUser.wallets.push(toWallet);
    }
    fromWallet.balance -= amount;

    await fromUser.save();
    await toUser.save();

    // Record transactions for both users
    await Transaction.create([
      {
        user: fromUser._id,
        type: 'Transfer',
        currency,
        amount,
        toUser: toUser._id,
        description: `Transfer to ${toUser.email}`,
      },
      {
        user: toUser._id,
        type: 'Deposit',
        currency,
        amount,
        toUser: fromUser._id,
        description: `Received from ${fromUser.email}`,
      },
    ]);

    res.status(200).json({
      message: `Transferred ${amount} ${currency} to ${toUser.userId}`,
    });
  } catch (error) {
    console.error('Error transferring funds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.wallets);
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    if (!fromWallet || fromWallet.balance < amount ) {
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
      message: `Convered successful`,
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
