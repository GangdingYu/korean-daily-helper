import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { getApiConfig } from "@/hooks/useApiConfig";
import { t } from "@/lib/i18n";
import { buildSystemPrompt } from "@/lib/prompts";
import { ApiMessage, ChatMessage, ChatMode } from "@/types/types";

const genId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (userInput: string, mode: ChatMode = "examples") => {
    if (!userInput.trim() || isLoading) return;

    const cfg = getApiConfig();
    if (!cfg.url || !cfg.key) {
      toast.error(t("apiNotConfigured", "en"));
      return;
    }

    const trimmed = userInput.trim();
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const history: ApiMessage[] = [...messagesRef.current.slice(-9), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemContent = buildSystemPrompt(mode, trimmed, cfg.systemPrompt);

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
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
          const dataStr = trimmedLine.slice(5).trim();
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
          } catch { /* malformed chunk */ }
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
  }, [isLoading]);

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
