import { useState } from "react";
import "./VoiceEmail.css";

const VoiceEmail = () => {
  const [isListening, setIsListening] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setEmailStatus("Listening...");
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setEmailStatus("Processing command...");

        try {
          const response = await fetch(
            "http://localhost:5000/api/parse-and-send",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ command: transcript }),
            }
          );

          const data = await response.json();
          setEmailStatus(data.message);
        } catch (error) {
          setEmailStatus("Error processing voice command");
          console.error("Error:", error);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setEmailStatus(`Error occurred: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      setEmailStatus("Speech recognition not supported in this browser.");
    }
  };

  return (
    <div className="voice-email-container">
      <h2>Voice Email Command</h2>
      <div className="voice-controls">
        <button
          className={`mic-button ${isListening ? "listening" : ""}`}
          onClick={startListening}
          disabled={isListening}
        >
          {isListening ? "🎤 Listening..." : "🎤 Start Speaking"}
        </button>
      </div>
      {transcript && (
        <div className="transcript-box">
          <h3>Your Command:</h3>
          <p>{transcript}</p>
        </div>
      )}
      {emailStatus && (
        <div className="status-box">
          <p>{emailStatus}</p>
        </div>
      )}
      <div className="instructions">
        <h3>How to use:</h3>
        <p>1. Click the microphone button</p>
        <p>2. Say "Send email to [email address]"</p>
        <p>3. Wait for confirmation</p>
      </div>
    </div>
  );
};

export default VoiceEmail;
