import { useState, useEffect } from "react";

export const useSpeechRecognition = ({ currentStep, onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recog = new window.webkitSpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";

      recog.onstart = () => {
        setIsListening(true);
        setError("");
      };

      recog.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        onResult(text);
      };

      recog.onerror = (event) => {
        setError("Recognition error: " + event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
        if (!isAssistantSpeaking && currentStep !== "initial") {
          setTimeout(() => recog.start(), 1000);
        }
      };

      setRecognition(recog);
    } else {
      setError("Speech recognition not supported in this browser.");
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [currentStep, isAssistantSpeaking, onResult]);

  const startListening = () => {
    if (recognition && !isListening && !isAssistantSpeaking) {
      recognition.start();
      setTranscript("");
    }
  };

  const resetTranscript = () => setTranscript("");

  return {
    isListening,
    transcript,
    error,
    isAssistantSpeaking,
    startListening,
    resetTranscript,
  };
};
