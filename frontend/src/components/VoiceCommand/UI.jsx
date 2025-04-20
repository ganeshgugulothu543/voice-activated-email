import React from "react";
import { motion } from "framer-motion";
import "./styles.css";

const VoiceUI = ({
  isListening,
  transcript,
  error,
  commandFeedback,
  resetCommand,
}) => {
  return (
    <div className="voice-command-container">
      <div className="voice-status">
        <motion.button
          className={`voice-button ${isListening ? "listening" : ""}`}
          onClick={resetCommand}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isListening ? "🎤 Listening..." : "🎤 Start Voice Command"}
        </motion.button>

        {isListening && (
          <div className="listening-indicator">
            <span className="pulse"></span>
            <span className="pulse"></span>
            <span className="pulse"></span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="transcript">
          <p>You said: {transcript}</p>
        </div>
      )}

      {commandFeedback && (
        <div className="command-feedback">
          <p>{commandFeedback}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="command-guide">
        <h3>Try saying:</h3>
        <ul>
          <li>"Send email"</li>
          <li>"What can you do?"</li>
          <li>"Help"</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceUI;
