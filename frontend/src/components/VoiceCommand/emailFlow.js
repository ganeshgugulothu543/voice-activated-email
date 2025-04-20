export const handleCommand = ({
  text,
  currentStep,
  emailData,
  setCurrentStep,
  setEmailData,
  onCommand,
  speak,
  setCommandFeedback,
}) => {
  const lower = text.toLowerCase();

  // Handle universal commands first
  if (lower.includes("cancel") || lower.includes("stop")) {
    setCurrentStep("initial");
    setEmailData({ to: "", subject: "", message: "" });
    speak("Email cancelled. How else can I help?");
    return;
  }

  // Handle state-specific commands
  switch (currentStep) {
    case "email":
      const emailMatch = text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );
      if (emailMatch) {
        const email = emailMatch[0];
        setEmailData((prev) => ({ ...prev, to: email }));
        setCurrentStep("subject");
        speak(`Got it. Email to ${email}. What is the subject?`);
        setCommandFeedback(`Recipient: ${email}`);
      } else {
        speak("I didn't catch a valid email address. Please say it again.");
      }
      break;

    case "subject":
      if (text.trim()) {
        setEmailData((prev) => ({ ...prev, subject: text }));
        setCurrentStep("message");
        speak("Thanks. What would you like the message to say?");
        setCommandFeedback(`Subject: ${text}`);
      } else {
        speak("I didn't catch the subject. Could you say it again?");
      }
      break;

    case "message":
      if (text.trim()) {
        const updatedData = { ...emailData, message: text };
        setEmailData(updatedData);
        setCurrentStep("initial");
        speak("Perfect! I'm preparing your email now.");
        setCommandFeedback("Email ready to send");
        onCommand({ type: "compose", ...updatedData });
      } else {
        speak("I didn't catch your message. Could you say it again?");
      }
      break;

    default:
      // Handle initial state commands
      if (
        lower.includes("send email") ||
        lower.includes("compose email") ||
        lower.includes("write email") ||
        lower.includes("new email")
      ) {
        setCurrentStep("email");
        speak("Sure. Who do you want to send the email to?");
        setCommandFeedback("Starting email composition...");
      } else if (lower.includes("help")) {
        speak(
          "You can say 'send email' to start composing, or 'cancel' to stop at any time."
        );
      } else {
        // Handle FAQ responses
        const faqResponses = {
          "what is your name": "I'm your email assistant.",
          "how are you":
            "I'm doing well, thank you! How can I help you with email?",
          "what can you do":
            "I can help you compose and send emails using your voice. Just say 'send email' to get started.",
        };

        let responded = false;
        for (let q in faqResponses) {
          if (lower.includes(q)) {
            speak(faqResponses[q]);
            responded = true;
            break;
          }
        }

        if (!responded) {
          speak(
            "I'm here to help with emails. Try saying 'send email' to get started, or 'help' for more options."
          );
        }
      }
  }
};
