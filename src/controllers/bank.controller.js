import axios from 'axios';
import User from '../model/user.js';

export const createDeposit = async (req, res) => {
  const { amount, currency } = req.body;
  if (!amount || !amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const response = await axios.get(
      `${process.env.FLW_BASE_URL}/payments`,
      {
        tx_ref: `dep_${Date.now()}`,
        amount,
        currency: currency,
        redirect_url: `${process.env.FRONTEND_URL}/deposit/callback`,
        customer: {
          email: user.email,
          name: user.firstName,
        },
        customization: {
          title: 'Deposit',
          description: 'Deposit funds to your wallet',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },

        // Create deposit record
      }
    );
    const deposit = {
      user: user._id,
      amount,
      currency,
      status: 'Pending',
      tx_ref: response.data.data.tx_ref,
    };

    res.status(201).json({ message: 'Deposit created successfully', deposit });
  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const flutterwaveWebhook = async (req, res) => {
  const signature = req.headers['verif-hash'];
  if (signature !== process.env.FLW_SECRET_HASH) {
    return res.status(403).json({ message: 'Invalid signature' });
  }
  const event = req.body.event;
  if (
    event.event === 'charge.completed' &&
    event.data.status === 'successful'
  ) {
    const { customer, amount, currency } = event.data;
    const user = await User.findOne({ email: customer.email });

    if (user) {
      let wallet = user.wallets.find((w) => w.currency === currency);
      if (wallet) {
        wallet.balance += amount;
      } else {
        user.wallets.push({ currency, balance: amount });
      }
        await user.save();
        console.log(`Deposited ${amount} ${currency} to ${user.email}'s wallet`);
        
    }
  }
  res.sendStatus(200);
};
