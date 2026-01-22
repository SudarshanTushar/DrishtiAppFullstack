export const voiceService = {
  async processVoiceCommand(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'command.wav');
    formData.append('language_code', 'hi-IN'); 

    try {
      const response = await fetch('https://drishtiappbackend-9d88613ee49f.herokuapp.com/listen', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();
      
      // Safety: Ensure strings exist to prevent UI crashes
      return {
        status: "success",
        translated_text: data.translated_text || "Voice Processed",
        voice_reply: data.voice_reply || "Command received.",
        target: data.target || "Unknown"
      };

    } catch (error) {
      console.warn("Voice Service Failed (Offline):", error);
      
      // FALLBACK: Return safe strings so the UI doesn't break
      return { 
        status: "error", 
        translated_text: "Offline Mode", 
        voice_reply: "Cannot connect to AI Server. Please type manually." 
      };
    }
  }
};