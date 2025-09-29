import axios from "axios";

export const getExchangeRate = async (from, to) => {
  try {
    // Example using Flutterwave Rates API
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transfers/rates?amount=100&destination_currency=${to}&source_currency=${from}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    return response.data?.data?.rate || null;
  } catch (err) {
    console.error("Exchange rate fetch error:", err.message);
    return null;
  }
};
