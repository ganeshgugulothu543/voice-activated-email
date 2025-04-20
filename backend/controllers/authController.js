const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create a transporter for sending emails
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: false,
  debug: false,
});

// Test email configuration
const testEmailConfig = async () => {
  try {
    console.log("Testing email configuration...");
    console.log("Email User:", process.env.EMAIL_USER);
    console.log("Email Pass length:", process.env.EMAIL_PASS?.length);

    const testResult = await transporter.verify();
    console.log("Email configuration is valid:", testResult);

    // Send a test email to verify full functionality
    if (process.env.NODE_ENV === "development") {
      const testMailOptions = {
        from: `"Email Assistant" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: "Email Service Test",
        text: "If you receive this email, your email service is working correctly.",
      };

      const info = await transporter.sendMail(testMailOptions);
      console.log("Test email sent successfully:", info.messageId);
    }
  } catch (error) {
    console.error("Email configuration error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });

    // Try recreating transporter with different settings
    console.log("Attempting alternative configuration...");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      const retryResult = await transporter.verify();
      console.log("Alternative configuration valid:", retryResult);
    } catch (retryError) {
      console.error("Alternative configuration failed:", retryError.message);
    }
  }
};

// Call test immediately
testEmailConfig();

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log("\n=== Password Reset OTP ===\n");
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log("\n=======================\n");

    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
    });

    // Email template
    const mailOptions = {
      from: `"Email Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">Password Reset OTP</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password. Here is your OTP:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #2d3436; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p style="color: #636e72; font-size: 12px; margin-top: 20px;">
            This is an automated email, please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: "OTP sent successfully",
      email: email,
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error.message);
    res.status(500).json({
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

// Verify OTP and Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if OTP exists and is valid
    const storedOtp = otpStore.get(email);
    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - storedOtp.timestamp > 5 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clear OTP
    otpStore.delete(email);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};
