import User from "../models/User.js";
import jwt from "jsonwebtoken";

// ✅ Admin emails hardcoded
const adminEmails = ["director@nitc.ac.in", "pa@nitc.ac.in"];

/**
 * @route POST /api/auth/login
 * @desc Login using OAuth profile info (email, googleId etc)
 * @access Public
 */
export const oauthLogin = async (req, res) => {
  try {
    const { email, name, googleId, profileImage } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Missing OAuth details" });
    }

    // ✅ Determine role from email domain
    let role_name = "external user";
    if (email.endsWith("@nitc.ac.in")) role_name = "internal user";
    if (adminEmails.includes(email)) role_name = "admin";

    // ✅ Check if user already exists
    let user = await User.findOne({ googleId });

    if (!user) {
      // ✅ Auto-register new user
      user = await User.create({
        googleId,
        email,
        name,
        role_name,
        profileImage
      });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role_name: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    console.error("OAuth Login Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route POST /api/auth/logout
 * @desc Logout (client deletes token)
 * @access Public
 */
export const logoutUser = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
