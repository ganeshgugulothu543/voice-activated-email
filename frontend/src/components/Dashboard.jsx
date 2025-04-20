import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Dashboard.css";
import InteractiveAssistant from "./InteractiveAssistant";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showCompose, setShowCompose] = useState(false);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const dropdownRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const [reminderData, setReminderData] = useState({
    to: "",
    subject: "",
    message: "",
    date: "",
    time: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Get user email from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserEmail(user.email || "user@example.com");

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReminderChange = (e) => {
    const { name, value } = e.target;
    setReminderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Email sent successfully!");
        setEmailData({ to: "", subject: "", message: "" });
      } else {
        setError(data.message || "Error sending email");
      }
    } catch (error) {
      setError("Error sending email. Please try again.");
      console.error("Error:", error);
    }
  };

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/set-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Reminder set successfully!");
        setReminderData({
          to: "",
          subject: "",
          message: "",
          date: "",
          time: "",
        });
      } else {
        setError(data.message || "Error setting reminder");
      }
    } catch (error) {
      setError("Error setting reminder. Please try again.");
      console.error("Error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitial = (email) => {
    return email.charAt(0).toUpperCase();
  };

  const faqItems = [
    {
      question: "How do I send an email?",
      answer:
        "Click the 'Compose Email' button or use voice commands by clicking the microphone button and saying 'send email to [email address]'.",
    },
    {
      question: "How do I use voice commands?",
      answer:
        "Click the microphone button and speak clearly. Say 'send email to [email address]' to start composing an email.",
    },
    {
      question: "How do I set an email reminder?",
      answer:
        "Click the 'Set Reminder' button, fill in the email details, and choose the date and time for the reminder.",
    },
  ];

  const handleSectionToggle = (section) => {
    setActiveSection(activeSection === section ? null : section);
    setShowCompose(section === "compose");
    setShowVoiceCommand(section === "voice");
    setShowReminder(section === "reminder");
    setShowFAQ(section === "faq");
  };

  const handleVoiceCommand = (command) => {
    if (command.type === "compose") {
      setActiveSection("compose");
      setShowCompose(true);
      setEmailData({
        to: command.email || "",
        subject: command.subject || "",
        message: command.message || "",
      });
    } else if (command.type === "reminder") {
      setActiveSection("reminder");
      setShowReminder(true);
      if (command.reminderData) {
        setReminderData(command.reminderData);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Email Dashboard</h1>
        <div className="action-buttons">
          <button
            className={`action-button ${
              activeSection === "compose" ? "active" : ""
            }`}
            onClick={() => handleSectionToggle("compose")}
          >
            Compose Mail
          </button>
          <button
            className={`action-button ${
              activeSection === "voice" ? "active" : ""
            }`}
            onClick={() => handleSectionToggle("voice")}
          >
            Voice Assistant
          </button>
          <button
            className={`action-button ${
              activeSection === "reminder" ? "active" : ""
            }`}
            onClick={() => handleSectionToggle("reminder")}
          >
            Set Reminder
          </button>
          <button
            className={`action-button ${
              activeSection === "faq" ? "active" : ""
            }`}
            onClick={() => handleSectionToggle("faq")}
          >
            FAQ
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {showCompose && (
          <div className="section-container">
            <h2>Compose New Email</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="email"
                  name="to"
                  placeholder="To"
                  value={emailData.to}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={emailData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <textarea
                  name="message"
                  placeholder="Message"
                  value={emailData.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Send Email
              </motion.button>
            </form>
          </div>
        )}

        {showVoiceCommand && (
          <div className="section-container">
            <h2>Voice Assistant</h2>
            <InteractiveAssistant onCommand={handleVoiceCommand} />
          </div>
        )}

        {showReminder && (
          <div className="section-container">
            <div className="reminder-form-container">
              <h2>Set Email Reminder</h2>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleReminderSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    name="to"
                    placeholder="Recipient's Email"
                    value={reminderData.to}
                    onChange={handleReminderChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    value={reminderData.subject}
                    onChange={handleReminderChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <textarea
                    name="message"
                    placeholder="Message"
                    value={reminderData.message}
                    onChange={handleReminderChange}
                    required
                  />
                </div>
                <div className="reminder-datetime">
                  <div className="input-group">
                    <input
                      type="date"
                      name="date"
                      value={reminderData.date}
                      onChange={handleReminderChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="time"
                      name="time"
                      value={reminderData.time}
                      onChange={handleReminderChange}
                      required
                    />
                  </div>
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Set Reminder
                </motion.button>
              </form>
            </div>
          </div>
        )}

        {showFAQ && (
          <div className="section-container">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-container">
              <div className="faq-list">
                {faqItems.map((item, index) => (
                  <div key={index} className="faq-item">
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="top-bar">
        <div className="user-menu" ref={dropdownRef}>
          <button
            className="avatar-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {getInitial(userEmail)}
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="user-info">
                <span className="user-email">{userEmail}</span>
              </div>
              <button className="dropdown-item" onClick={handleLogout}>
                <span className="icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-buttons">
              <button className="confirm-button" onClick={handleLogout}>
                Yes, Logout
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
