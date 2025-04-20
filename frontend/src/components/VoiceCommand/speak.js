export const speak = (text, callback = () => {}) => {
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => {
      callback();
    };

    window.speechSynthesis.speak(utterance);
  }
};
