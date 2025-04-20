import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./VoiceCommand/styles.css";

const CONVERSATION_STATES = {
  IDLE: "idle",
  WAITING_FOR_COMMAND: "waiting_for_command",
  WAITING_FOR_RECIPIENT: "waiting_for_recipient",
  WAITING_FOR_SUBJECT: "waiting_for_subject",
  WAITING_FOR_MESSAGE: "waiting_for_message",
  CONFIRMING: "confirming",
};

const COMMANDS = {
  SEND_EMAIL: [
    "send email",
    "compose",
    "write email",
    "new email",
    "create email",
    "send mail",
  ],
  CANCEL: ["cancel", "stop", "nevermind", "never mind", "quit", "exit"],
  CONFIRM: [
    "yes",
    "sure",
    "okay",
    "correct",
    "right",
    "yep",
    "yeah",
    "send it",
    "looks good",
  ],
  DENY: ["no", "nope", "incorrect", "wrong", "don't", "do not", "change it"],
  GREETINGS: [
    "hello",
    "hi",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "hi there",
  ],
  HELP: [
    "help",
    "what can you do",
    "commands",
    "assist",
    "guide me",
    "how does this work",
  ],
  REPEAT: ["repeat", "say again", "what did you say", "pardon", "come again"],
  COMPOSE: ["compose a new message", "write a new message", "new message"],
};

const IDLE_TIMEOUT = 30000; // 30 seconds

const InteractiveAssistant = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [recognition, setRecognition] = useState(null);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [conversationState, setConversationState] = useState(
    CONVERSATION_STATES.IDLE
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [idleTimer, setIdleTimer] = useState(null);
  const [lastResponse, setLastResponse] = useState("");
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: "",
  });

  const matchCommand = (text, commandList) => {
    return commandList.some((cmd) => text.toLowerCase().includes(cmd));
  };

  const speak = async (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech and recognition
      window.speechSynthesis.cancel();
      if (recognition) {
        recognition.stop();
      }

      setIsAssistantSpeaking(true);
      setLastResponse(text);

      return new Promise((resolve) => {
        const speech = new SpeechSynthesisUtterance();
        speech.text = text;
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;

        speech.onend = () => {
          console.log("Speech ended, starting listening...");
          setIsAssistantSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(speech);
      });
    }
    return Promise.resolve();
  };

  const getRandomResponse = (responses) => {
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateResponse = (state, command) => {
    const responses = {
      greeting: [
        "Hi there! I can help you send emails. Just say 'send email' to get started.",
        "Hello! Ready to help you compose emails. Say 'send email' when you're ready.",
        "Hey! Need to send an email? Just say 'send email' and I'll guide you through it.",
      ],
      help: [
        "I can help you send emails. Try saying: 'send email', 'compose new message', or 'write email'. You can say 'cancel' anytime to start over.",
        "Need to send an email? Just say 'send email' and I'll guide you through it. You can also say 'cancel' at any time.",
      ],
      askRecipient: [
        "Who would you like to send this email to? Please say their email address.",
        "What's the recipient's email address?",
        "Sure, I'll help you send an email. Who's it for? Please spell out their email address.",
      ],
      invalidEmail: [
        "I need a valid email address. Could you spell it out for me?",
        "I didn't catch a valid email. Could you say it again slowly?",
        "Please provide a complete email address, like example@domain.com",
      ],
      askSubject: [
        "Great! What should be the subject of your email?",
        "What would you like to put in the subject line?",
        "Perfect. Tell me what this email is about.",
      ],
      askMessage: [
        "What message would you like to send?",
        "What should the email say?",
        "Please tell me the message you'd like to send.",
      ],
      confirm: [
        "Here's what I've got: Sending to {email} with subject '{subject}' and message: '{message}'. Should I send it?",
        "I'll send this email to {email} about '{subject}' saying: '{message}'. Does that look right?",
        "Ready to send to {email}, subject: '{subject}', message: '{message}'. Shall I proceed?",
      ],
      cancelled: [
        "Okay, I've cancelled that. Let me know if you want to try again by saying 'send email'.",
        "No problem, we can start over whenever you're ready. Just say 'send email'.",
        "Email cancelled. Say 'send email' when you want to try again.",
      ],
      success: [
        "Perfect! I'm preparing your email now. You can review it before sending.",
        "Great! Opening the email form for you to review.",
        "Excellent! Getting that email ready for you to check.",
      ],
      unclear: [
        "I didn't quite catch that. Try saying 'send email' to start, or 'help' for more options.",
        "Sorry, I'm not sure what you want to do. Say 'help' to see what I can do.",
        "Could you try saying that again? Or say 'help' for available commands.",
      ],
      change: [
        "What would you like to change? You can say 'recipient', 'subject', or 'message'.",
        "Which part needs changing? The recipient, subject, or message?",
      ],
    };

    return getRandomResponse(responses[state]).replace(
      /{email}|{subject}|{message}/g,
      (match) =>
        ({
          "{email}": emailData.to,
          "{subject}": emailData.subject,
          "{message}": emailData.message,
        }[match])
    );
  };

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (conversationState !== CONVERSATION_STATES.IDLE) {
      const timer = setTimeout(() => {
        const response = "Still there? I'm here when you're ready.";
        addToConversation("assistant", response);
        speak(response);
        setConversationState(CONVERSATION_STATES.IDLE);
      }, IDLE_TIMEOUT);
      setIdleTimer(timer);
    }
  };

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Recognition started");
        setIsListening(true);
        setError("");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized:", transcript);
        setTranscript(transcript);
        processCommand(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        setError("Error occurred in recognition: " + event.error);
        setIsListening(false);
        // Try to restart listening after error
        if (hasStarted && !isAssistantSpeaking) {
          setTimeout(async () => {
            await startListening();
          }, 1000);
        }
      };

      recognition.onend = () => {
        console.log("Recognition ended");
        setIsListening(false);
        // Automatically restart listening if we're in an active session
        if (hasStarted && !isAssistantSpeaking) {
          setTimeout(async () => {
            await startListening();
          }, 250);
        }
      };

      setRecognition(recognition);
    } else {
      setError("Speech recognition is not supported in this browser.");
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const addToConversation = (type, text) => {
    setConversationHistory((prev) => [...prev, { type, text }]);
  };

  const startListening = async () => {
    if (!recognition || isListening || isAssistantSpeaking) {
      console.log("Cannot start listening:", {
        hasRecognition: !!recognition,
        isListening,
        isAssistantSpeaking,
      });
      return;
    }

    try {
      // Always stop before starting
      recognition.stop();

      // Short delay to ensure recognition is fully stopped
      await new Promise((resolve) => setTimeout(resolve, 250));

      recognition.start();
      setTranscript("");
      console.log("Started listening");
    } catch (error) {
      console.error("Error starting recognition:", error);
      // Try one more time after a longer delay
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        recognition.start();
        console.log("Started listening (retry)");
      } catch (retryError) {
        console.error("Final recognition start error:", retryError);
      }
    }
  };

  const handleStart = async () => {
    if (!hasStarted) {
      setHasStarted(true);
      const greeting =
        "Hi there! I can help you send emails. Just say 'send email' to get started.";
      addToConversation("assistant", greeting);
      await speak(greeting);
      // Start listening after initial greeting
      await new Promise((resolve) => setTimeout(resolve, 500));
      await startListening();
    } else {
      await startListening();
    }
  };

  const extractEmailFromText = (text) => {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
  };

  const processCommand = async (text) => {
    if (isAssistantSpeaking) return;

    const lowerText = text.toLowerCase().trim();
    console.log(
      "Processing command:",
      lowerText,
      "Current state:",
      conversationState
    );

    // Stop current recognition
    if (recognition) {
      recognition.stop();
    }

    addToConversation("user", text);
    let response;

    // Handle universal commands first
    if (matchCommand(lowerText, COMMANDS.CANCEL)) {
      setConversationState(CONVERSATION_STATES.IDLE);
      setEmailData({ to: "", subject: "", message: "" });
      response = generateResponse("cancelled");
    } else if (matchCommand(lowerText, COMMANDS.HELP)) {
      response = generateResponse("help");
    } else if (matchCommand(lowerText, COMMANDS.REPEAT)) {
      response = lastResponse;
    } else if (matchCommand(lowerText, COMMANDS.GREETINGS)) {
      response = generateResponse("greeting");
    } else {
      switch (conversationState) {
        case CONVERSATION_STATES.IDLE:
          if (
            matchCommand(lowerText, [
              ...COMMANDS.SEND_EMAIL,
              ...COMMANDS.COMPOSE,
            ])
          ) {
            setConversationState(CONVERSATION_STATES.WAITING_FOR_RECIPIENT);
            response = generateResponse("askRecipient");
          } else {
            response = generateResponse("help");
          }
          break;

        case CONVERSATION_STATES.WAITING_FOR_RECIPIENT:
          const email = extractEmailFromText(text);
          if (email) {
            setEmailData((prev) => ({ ...prev, to: email }));
            setConversationState(CONVERSATION_STATES.WAITING_FOR_SUBJECT);
            response = generateResponse("askSubject");
          } else {
            response = generateResponse("invalidEmail");
          }
          break;

        case CONVERSATION_STATES.WAITING_FOR_SUBJECT:
          if (text.trim()) {
            setEmailData((prev) => ({ ...prev, subject: text }));
            setConversationState(CONVERSATION_STATES.WAITING_FOR_MESSAGE);
            response = generateResponse("askMessage");
          } else {
            response = generateResponse("unclear");
          }
          break;

        case CONVERSATION_STATES.WAITING_FOR_MESSAGE:
          if (text.trim()) {
            setEmailData((prev) => ({ ...prev, message: text }));
            setConversationState(CONVERSATION_STATES.CONFIRMING);
            response = generateResponse("confirm");
          } else {
            response = generateResponse("unclear");
          }
          break;

        case CONVERSATION_STATES.CONFIRMING:
          if (matchCommand(lowerText, COMMANDS.CONFIRM)) {
            onCommand({
              type: "compose",
              email: emailData.to,
              subject: emailData.subject,
              message: emailData.message,
            });
            setConversationState(CONVERSATION_STATES.IDLE);
            setEmailData({ to: "", subject: "", message: "" });
            response = generateResponse("success");
          } else if (matchCommand(lowerText, COMMANDS.DENY)) {
            response = generateResponse("change");
          } else {
            response = "Should I send this email? Please say yes or no.";
          }
          break;

        default:
          response = generateResponse("unclear");
      }
    }

    addToConversation("assistant", response);
    await speak(response);

    // Ensure we wait a bit after speaking before starting to listen
    await new Promise((resolve) => setTimeout(resolve, 500));
    await startListening();
  };

  return (
    <div className="interactive-assistant-container">
      <div className="conversation-container">
        {conversationHistory.map((message, index) => (
          <motion.div
            key={index}
            className={`message ${message.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="message-content">
              <span className="message-icon">
                {message.type === "user" ? "👤" : "🤖"}
              </span>
              <p>{message.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="controls">
        <motion.button
          className={`voice-button ${isListening ? "listening" : ""}`}
          onClick={handleStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isAssistantSpeaking}
        >
          {!hasStarted
            ? "Start Assistant"
            : isListening
            ? "Listening..."
            : "Start Speaking"}
        </motion.button>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default InteractiveAssistant;
