import User from '../model/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { parsePhoneNumberFromString, getCountries } from 'libphonenumber-js';

export const registration = async (req, res) => {
  try {
    let { firstName, lastName, email, phoneNumber, password, country } =
      req.body;

    if (
      !(email && password && firstName && lastName && phoneNumber && country)
    ) {
      return res.status(400).json({ message: 'All input is required' });
    }

    // Normalize inputs
    email = email.toLowerCase().trim();
    phoneNumber = String(phoneNumber).trim();

    // Validate country code
    const validCountries = getCountries();
    if (!validCountries.includes(country)) {
      return res.status(400).json({ message: 'Invalid country code' });
    }

    // Validate phone number
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, country);
    if (!phoneNumberObj || !phoneNumberObj.isValid()) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
    const formattedPhone = phoneNumberObj.format('E.164');

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber: formattedPhone }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({
          message: 'Email or phone number already exists. Please login.',
        });
    }
    const countryCurrencyMap = {
      NG: "NGN",
      US: "USD",
      UK: "GBP",
      GM: "GMD",

    }
    const walletCurrency = countryCurrencyMap[country] || 'USD'; // Default to USD if country not mapped

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      country,
      phoneNumber: formattedPhone,
      wallets: [{ currency: walletCurrency, balance: 0 }],
    });
    await user.save(); // ensures pre-save hook runs

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    //console.log("User found:", user); // Debug log
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    //console.log("Password match:", passwordMatch); // Debug log
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, // Change user_id to userId
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
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
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({ message: `${result.deletedCount} users deleted` });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const nigerianUsers = await User.find({ country: 'Nigeria' });
    if (!nigerianUsers || nigerianUsers.length === 0) {
      return res.status(404).json({ message: 'No Nigerian users found' });
    }
    res.status(200).json(nigerianUsers);
  } catch (error) {
    console.error('Error fetching Nigerian users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
