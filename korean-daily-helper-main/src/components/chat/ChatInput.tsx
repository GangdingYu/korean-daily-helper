import React, { KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChatMode } from "@/types/types";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const QUICK_PROMPTS: Record<ChatMode, Array<{ label: string; text: string }>> = {
  examples: [
    { label: "Greeting", text: "How do young Koreans greet friends for the first time" },
    { label: "Express joy", text: "How to say I am so happy hanging out with friends" },
    { label: "Say like", text: "How to express I like someone in Korean slang" },
    { label: "Say bored", text: "How to say I am bored in Korean slang" },
    { label: "Ask help", text: "How to ask for help politely in Korean" },
    { label: "Decline", text: "How to gently decline an invitation in Korean" },
  ],
  dialogue: [
    { label: "Cafe order", text: "We are at a cafe, I want to practice ordering in Korean" },
    { label: "Invite friend", text: "Ask a friend to hang out this weekend in Korean" },
    { label: "Bargain", text: "At a market buying clothes, bargaining with the vendor" },
    { label: "Daily chat", text: "Casually chat with a friend about what happened today" },
    { label: "Movie talk", text: "Just watched a movie, discussing the plot with a friend" },
    { label: "Ask directions", text: "Lost on a street in Korea, asking for directions" },
  ],
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSend, onStop, isLoading, disabled, mode, onModeChange,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const t = e.target;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
  };

  const handleQuickPrompt = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const currentPrompts = QUICK_PROMPTS[mode];

  return (
    <div className="border-t border-border bg-background">
      <div className="px-4 pt-4 pb-2">
        <div className="inline-flex items-center bg-muted rounded-sm p-0.5 gap-0.5 border border-border">
          {([
            { key: "examples" as ChatMode, icon: "📝" },
            { key: "dialogue" as ChatMode, icon: "💬" },
          ]).map(({ key: m, icon }) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              disabled={isLoading}
              className={cn(
                "px-3 py-1.5 rounded-sm text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                "disabled:cursor-not-allowed",
                mode === m
                  ? "bg-background text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <span className="text-xs">{icon}</span>
              {m === "examples" ? t("modeExamples", "en") : t("modeDialogue", "en")}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {mode === "examples" ? t("modeExamplesDesc", "en") : t("modeDialogueDesc", "en")}
        </p>
      </div>

      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {currentPrompts.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            onClick={() => handleQuickPrompt(prompt.text)}
            disabled={isLoading}
            className={cn(
              "text-xs px-2.5 py-1 rounded-sm border border-border",
              "text-muted-foreground bg-background",
              "hover:border-ring hover:text-ring transition-colors duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 pt-1 flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={mode === "examples" ? t("placeholderExamples", "en") : t("placeholderDialogue", "en")}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "resize-none min-h-[44px] max-h-[160px] py-3",
              "border-border focus-visible:ring-ring focus-visible:ring-1",
              "rounded-sm text-sm leading-relaxed transition-colors duration-200",
              "placeholder:text-muted-foreground"
            )}
          />
        </div>
        <div className="flex-shrink-0">
          {isLoading ? (
            <Button
              type="button"
              onClick={onStop}
              variant="outline"
              size="sm"
              className="px-3 h-11 rounded-sm border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {t("stop", "en")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              size="sm"
              className="px-4 h-11 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("send", "en")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
