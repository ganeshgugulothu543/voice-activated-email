const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/parse-and-send", async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ message: "No command provided" });
    }

    // Convert command to lowercase for easier parsing
    const lowerCommand = command.toLowerCase();

    // Extract email using regex
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emailMatch = lowerCommand.match(emailRegex);

    if (!emailMatch || !lowerCommand.includes("send email to")) {
      return res.status(400).json({
        message: 'Invalid command. Please say "send email to [email address]"',
      });
    }

    const recipient = emailMatch[0];

    // For demo purposes, using fixed subject and message
    // In production, you might want to extract these from the voice command
    const emailData = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: "Voice Commanded Email",
      text: "This email was sent using voice command.",
      html: `
        <h2>Voice Commanded Email</h2>
        <p>This email was sent using a voice command through our application.</p>
        <p>Original command: "${command}"</p>
      `,
    };

    // Send email
    await transporter.sendMail(emailData);

    res.json({
      message: `Email sent successfully to ${recipient}`,
      success: true,
    });
  } catch (error) {
    console.error("Voice email error:", error);
    res.status(500).json({
      message: "Failed to process voice command and send email",
      error: error.message,
    });
  }
});

module.exports = router;
