import axios from "axios";
import User from "../model/user.js";
import Deposit from "../model/deposit.js";
import Wallet from "../model/wallet.js";

export const createDeposit = async (req, res) => {
  const { amount, currency } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const response = await axios.post(
      `${process.env.FLW_BASE_URL}/payments`,
      {
        tx_ref: `dep_${Date.now()}`,
        amount,
        currency,
        redirect_url: "http://localhost:7070/api/bank/deposit/callback",
        customer: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        customization: {
          title: "Deposit",
          description: "Deposit funds to your wallet",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const deposit = {
      user: user._id,
      amount,
      currency,
      status: "Pending",
      tx_ref: response.data.data.tx_ref,
      payment_link: response.data.data.link,
    };

    return res.status(201).json({
      message: "Deposit created successfully",
      deposit,
    });
  } catch (error) {
    console.error(
      "Error creating deposit:",
      error.response?.data || error.message
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyDepositOTP = async (req, res) => {
  try {
    const { flw_ref, otp, amount } = req.body;
    const userId = req.user.userId;

    if (!flw_ref || !otp || !amount) {
      return res
        .status(400)
        .json({ message: "flw_ref, otp and amount are required" });
    }

    // Send OTP to Flutterwave to validate transaction
    const response = await axios.post(
      "https://api.flutterwave.com/v3/validate-charge",
      { otp, flw_ref },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = response.data;

    if (status === "success" && data.status === "successful") {
      // Update user wallet
      const wallet = await Wallet.findOne({ userId });
      wallet.balance += amount;
      await wallet.save();

      return res.status(200).json({
        message: "Deposit completed successfully",
        wallet,
      });
    }

    return res.status(400).json({ message: "OTP verification failed" });
  } catch (error) {
    console.error(
      "OTP verification error:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const flutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers["verif-hash"];
    if (signature !== process.env.FLW_SECRET_KEY) {
      console.warn("Invalid webhook signature");
      return res.status(403).json({ message: "Invalid signature" });
    }

    const event = req.body;

    if (
      event.event === "charge.completed" &&
      event.data.status === "successful"
    ) {
      const { customer, amount, currency, tx_ref, id: flw_id } = event.data;

      const existingDeposit = await Deposit.findOne({ tx_ref });
      if (existingDeposit) {
        console.log(`Duplicate deposit ignored for tx_ref: ${tx_ref}`);
        return res.sendStatus(200);
      }

      const user = await User.findOne({ email: customer.email });
      if (!user) {
        console.warn(`User with email ${customer.email} not found`);
        return res.sendStatus(404);
      }

      let wallet = user.wallets.find((w) => w.currency === currency);
      if (wallet) {
        wallet.balance += amount;
      } else {
        user.wallets.push({ currency, balance: amount });
      }

      let walletDoc = await Wallet.findOne({ userId: user._id, currency });
      if (walletDoc) {
        walletDoc.balance += amount;
        await walletDoc.save();
      } else {
        await Wallet.create({ userId: user._id, currency, balance: amount });
      }

      await user.save();

      await Deposit.create({
        tx_ref,
        user: user._id,
        amount,
        currency,
        status: "Successful",
        flw_id,
      });

      console.log(`Deposited ${amount} ${currency} to ${user.email}'s wallet`);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.sendStatus(500);
  }
};
export const depositCallback = async (req, res) => {
  const { tx_ref, status } = req.query;
  if (status !== "successful") {
    return res.status(400).json({ message: "Deposit not successful" });
  }
  try {
    //Find User and update wallet
    const depositRecord = await User.findOne({
      "deposits.tx_ref": tx_ref,
    });
    res.status(200).json({ message: "Deposit completed successfully", tx_ref });
  } catch (error) {
    console.error("Error in deposit callback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserDeposits = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ deposits: user.deposits || [] });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
