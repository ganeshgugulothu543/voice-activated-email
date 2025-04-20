const express = require("express");
const router = express.Router();
const transporter = require("../config/emailConfig");

// Send email route
router.post("/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    // Validate input
    if (!to || !subject || !message) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: message,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    res
      .status(500)
      .json({ message: "Error sending email", error: error.message });
  }
});

// Set reminder route
router.post("/set-reminder", async (req, res) => {
  try {
    const { to, subject, message, date, time } = req.body;

    // Validate input
    if (!to || !subject || !message || !date || !time) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const reminderDate = new Date(`${date}T${time}`);
    const now = new Date();

    if (reminderDate <= now) {
      return res
        .status(400)
        .json({ message: "Reminder time must be in the future" });
    }

    // Schedule the email
    const timeoutId = setTimeout(async () => {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: to,
          subject: `REMINDER: ${subject}`,
          text: message,
        };

        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.error("Reminder email sending error:", error);
      }
    }, reminderDate.getTime() - now.getTime());

    res.status(200).json({ message: "Reminder set successfully" });
  } catch (error) {
    console.error("Setting reminder error:", error);
    res
      .status(500)
      .json({ message: "Error setting reminder", error: error.message });
  }
});

module.exports = router;
