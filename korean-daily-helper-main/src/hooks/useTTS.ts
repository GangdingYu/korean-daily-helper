import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export type TTSState = "idle" | "loading" | "playing";

let koreanVoice: SpeechSynthesisVoice | null = null;

function findKoreanVoice(): SpeechSynthesisVoice | null {
  if (koreanVoice) return koreanVoice;
  const voices = window.speechSynthesis.getVoices();
  koreanVoice =
    voices.find((v) => v.lang.includes("ko")) ||
    voices.find((v) => v.lang.includes("KO")) ||
    voices[0] ||
    null;
  return koreanVoice;
}

export function useTTS() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    utterRef.current = null;
    setPlayingId(null);
    setLoadingId(null);
  }, []);

  const speak = useCallback(async (messageId: string, text: string) => {
    if (playingId === messageId) {
      stopAudio();
      return;
    }

    stopAudio();
    setLoadingId(messageId);

    try {
      const voice = findKoreanVoice();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = voice?.lang || "ko-KR";
      if (voice) utter.voice = voice;
      utter.rate = 0.9;
      utter.pitch = 1;

      utter.onend = () => {
        utterRef.current = null;
        setPlayingId(null);
      };
      utter.onerror = () => {
        utterRef.current = null;
        setPlayingId(null);
      };

      utterRef.current = utter;
      setLoadingId(null);
      setPlayingId(messageId);
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.error("TTS error:", err);
      toast.error("Voice playback failed");
      setLoadingId(null);
      setPlayingId(null);
    }
  }, [playingId, stopAudio]);

  const getState = useCallback(
    (messageId: string): TTSState => {
      if (loadingId === messageId) return "loading";
      if (playingId === messageId) return "playing";
      return "idle";
    },
    [loadingId, playingId]
  );

  return { speak, stopAudio, getState };
}
