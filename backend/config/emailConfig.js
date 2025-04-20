const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: false, // Disable logging
  debug: false, // Disable debug
});

// Test the transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error);
  }
});

module.exports = transporter;
