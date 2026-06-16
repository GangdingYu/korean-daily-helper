import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { getApiConfig } from "@/hooks/useApiConfig";
import { t } from "@/lib/i18n";
import { ApiMessage, ChatMessage, ChatMode } from "@/types/types";

const genId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const PROMPT_EXAMPLES =
  "You are a Korean daily expressions coach.\n" +
  "\nRules:\n" +
  "1. Give exactly 3 natural Korean example sentences for the scene the user described.\n" +
  "2. Each example: Korean text + English translation.\n" +
  "3. The Korean must sound like real spoken Korean from a 20-something. Use contractions, fillers, and internet slang naturally.\n" +
  "4. Do NOT add grammar analysis, cultural background, or extra explanation. Just the 3 examples.\n" +
  "5. Format: numbered list only.\n";

const PROMPT_DIALOGUE =
  "You are a Korean conversation partner.\n" +
  "\nRules:\n" +
  "1. Start with 1 sentence describing the scene in English.\n" +
  "2. Show a natural Korean dialogue between 2 people. Use emoji. Use 반말 for friends, 해요체 for strangers.\n" +
  "3. After the dialogue, give 2-3 possible replies the USER could say next. Each: Korean text + English translation.\n" +
  "4. For each user reply, show what the OTHER person would say back in Korean.\n" +
  "5. The dialogue must feel like real friends talking on a Seoul street. Use contractions, fillers (아, 음, 그냥), emotional particles (ㅋㅋ, ㅠㅠ).\n" +
  "6. Do NOT add grammar analysis or extra explanation. Keep it clean and natural.\n";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userInput: string, mode: ChatMode = "examples") => {
    if (!userInput.trim() || isLoading) return;

    const cfg = getApiConfig();
    if (!cfg.url || !cfg.key) {
      toast.error(t("apiNotConfigured", "en"));
      return;
    }

    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: userInput.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const history: ApiMessage[] = [...messages.slice(-9), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemContent = cfg.systemPrompt || (mode === "dialogue" ? PROMPT_DIALOGUE : PROMPT_EXAMPLES);

    const assistantId = genId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      mode,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${cfg.url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cfg.key}`,
        },
        body: JSON.stringify({
          model: cfg.model || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemContent },
            ...history,
          ],
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: { message: "Request failed" } }));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("Empty response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const chunk = parsed.choices?.[0]?.delta?.content ?? "";
            if (chunk) {
              full += chunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: full, isStreaming: true } : m
                )
              );
            }
          } catch { /* skip bad chunk */ }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: full || t("noResponse", "en"), isStreaming: false, mode }
            : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }
      const msg = (err as Error).message || t("networkError", "en");
      console.error("Chat error:", err);
      toast.error(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, stopStreaming, clearMessages };
}
