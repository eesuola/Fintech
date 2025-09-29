import User from "../model/user.js";
import Wallet from "../model/wallet.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { countryCurrencyMap } from "../utils/countryCurrency.js";
import { getCountryAndCurrencyFromPhone } from "../utils/phoneToCurrency.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const registration = async (req, res) => {
  try {
    let { firstName, lastName, email, phoneNumber, password, country } =
      req.body;

    if (!(email && password && firstName && lastName && phoneNumber)) {
      return res.status(400).json({ message: "All input is required" });
    }

    // Normalize inputs
    email = email.toLowerCase().trim();

    // Parse and normalize phone number
    const parsedPhone = parsePhoneNumberFromString(
      phoneNumber,
      country || "NG"
    );
    if (!parsedPhone || !parsedPhone.isValid()) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const normalizedPhone = parsedPhone.number;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber: normalizedPhone }],
    });
    if (existingUser) {
      return res.status(409).json({
        message: "Email or phone number already exists. Please login.",
      });
    }

    // Auto-detect country & currency from phone
    const { country: detectedCountry, currency } =
      getCountryAndCurrencyFromPhone(phoneNumber);
    if (!detectedCountry || !currency) {
      return res.status(400).json({
        error: "Could not determine country/currency from phone number",
      });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      country: detectedCountry,
      phoneNumber: normalizedPhone,
      currency,
    });
    await newUser.save();

    // Create wallet for user
    const wallet = new Wallet({
      userId: newUser._id,
      currency,
      balance: 0,
    });
    await wallet.save();


    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        country: newUser.country,
        currency: newUser.currency,
      },
      wallet: {
        id: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Determine if loginIdentifier is email or phone number
    let query = {};
    if (loginIdentifier.includes("@")) {
      
      query.email = loginIdentifier.toLowerCase().trim();
    } else {
  
      query.phoneNumber = loginIdentifier.trim();
    }

    // 3. Find user
    const user = await User.findOne(query);
    //console.log("User found:", user); // Debug log
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    //console.log("Password match:", passwordMatch); 
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    req.session.loggedIn = true;
    req.session.userName = user.firstName;
    res.json({
      success: true,
      name: user.firstName,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({ message: `${result.deletedCount} users deleted` });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getUserProfile = async (req, res) => {
//   try {
//     const userId = req.user.user_id; // Get user ID from the token
//     const user = await User.findById(userId).select('-password -__v'); // Exclude password and __v field
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json(sanitizeUser(user)); // Return sanitized user data
//   } catch (error) {
//     console.error('Error fetching user profile:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

export const getAllUsers = async (req, res) => {
  try {
    // Extract page and limit from query. Default: page 1, 10 results per page.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Fetch paginated data
    const users = await User.find().skip(skip).limit(limit);

    // Optional: total count for frontend to know total pages
    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: users,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllNigerianUsers = async (req, res) => {
  try {
    const nigerianUsers = await User.find({ country: "Nigeria" });
    if (!nigerianUsers || nigerianUsers.length === 0) {
      return res.status(404).json({ message: "No Nigerian users found" });
    }
    res.status(200).json(nigerianUsers);
  } catch (error) {
    console.error("Error fetching Nigerian users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
