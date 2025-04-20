import React, { useState } from "react";
import { useSpeechRecognition } from "./useSpeech";
import { speak } from "./speak";
import { handleCommand } from "./emailFlow";
import VoiceUI from "./UI";

const VoiceCommand = ({ onCommand }) => {
  const [commandFeedback, setCommandFeedback] = useState("");
  const [currentStep, setCurrentStep] = useState("initial");
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: "",
  });

  const {
    isListening,
    transcript,
    error,
    isAssistantSpeaking,
    startListening,
    resetTranscript,
  } = useSpeechRecognition({
    currentStep,
    onResult: (text) => {
      handleCommand({
        text,
        currentStep,
        emailData,
        setCurrentStep,
        setEmailData,
        onCommand,
        speak,
        setCommandFeedback,
      });
    },
  });

  const resetCommand = () => {
    setCurrentStep("initial");
    setEmailData({ to: "", subject: "", message: "" });
    setCommandFeedback("");
    speak("How can I help you today?");
    resetTranscript();
  };

  return (
    <VoiceUI
      isListening={isListening}
      transcript={transcript}
      error={error}
      commandFeedback={commandFeedback}
      resetCommand={resetCommand}
    />
  );
};

export default VoiceCommand;
