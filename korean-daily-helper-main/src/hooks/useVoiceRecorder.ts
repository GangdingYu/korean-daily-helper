import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/db/supabase";

export type RecorderState = "idle" | "recording" | "processing";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void;
}

// 将AudioBuffer转换为16kHz单声道PCM WAV的base64编码
async function encodeWavBase64(audioBlob: Blob): Promise<{ base64: string; len: number }> {
  const arrayBuffer = await audioBlob.arrayBuffer();

  // 解码音频数据
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  // 重采样至16000Hz单声道
  const targetSampleRate = 16000;
  const duration = audioBuffer.duration;
  const numSamples = Math.ceil(duration * targetSampleRate);

  const offlineCtx = new OfflineAudioContext(1, numSamples, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const resampledBuffer = await offlineCtx.startRendering();

  // 编码为PCM WAV格式
  const pcmData = resampledBuffer.getChannelData(0);
  const pcmLength = pcmData.length;
  const wavBuffer = new ArrayBuffer(44 + pcmLength * 2);
  const view = new DataView(wavBuffer);

  // WAV文件头
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcmLength * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 单声道
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, pcmLength * 2, true);

  // PCM样本数据（16bit）
  let offset = 44;
  for (let i = 0; i < pcmLength; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  // 转换为base64
  const uint8 = new Uint8Array(wavBuffer);
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < uint8.length; i += CHUNK) {
    binary += String.fromCharCode(...uint8.subarray(i, i + CHUNK));
  }
  const base64 = btoa(binary);

  return { base64, len: wavBuffer.byteLength };
}

export function useVoiceRecorder({ onTranscript }: UseVoiceRecorderOptions) {
  const [state, setState] = useState<RecorderState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (state !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // 停止麦克风流
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        setState("processing");
        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const { base64, len } = await encodeWavBase64(audioBlob);

          const { data, error } = await supabase.functions.invoke("speech-to-text", {
            body: { audio_base64: base64, len },
          });

          if (error) {
            const msg = await error?.context?.text?.();
            throw new Error(msg || error.message || "语音识别失败");
          }

          if (data?.text) {
            onTranscript(data.text);
          } else {
            toast.error("未识别到语音内容，请重试");
          }
        } catch (err) {
          console.error("语音识别错误:", err);
          toast.error((err as Error).message || "语音识别失败，请重试");
        } finally {
          setState("idle");
        }
      };

      mediaRecorder.start(100);
      setState("recording");
    } catch (err) {
      console.error("录音启动失败:", err);
      if ((err as Error).name === "NotAllowedError") {
        toast.error("请在浏览器中允许麦克风权限");
      } else {
        toast.error("无法启动录音，请检查麦克风");
      }
      setState("idle");
    }
  }, [state, onTranscript]);

  const stopRecording = useCallback(() => {
    if (state !== "recording" || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  }, [state]);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    // 取消：移除onstop回调，不发送识别请求
    mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("idle");
  }, []);

  return { state, startRecording, stopRecording, cancelRecording };
}
