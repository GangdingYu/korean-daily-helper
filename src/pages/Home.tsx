import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatInput from "@/components/chat/ChatInput";
import MessageList from "@/components/chat/MessageList";
import { ApiSettings } from "@/components/settings/ApiSettings";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useChat } from "@/hooks/useChat";
import { useTTS } from "@/hooks/useTTS";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChatMode } from "@/types/types";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ChatMode>("examples");
  const { messages, isLoading, sendMessage, stopStreaming, clearMessages } = useChat();
  const { speak, getState } = useTTS();
  const { count: favCount } = useFavorites();
  const { isReady } = useApiConfig();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSend = (text: string) => {
    sendMessage(text, mode);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">한</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              {t("appName", "en")}
            </h1>
            <p className="text-xs text-muted-foreground leading-tight hidden md:block">
              {t("appSubtitle", "en")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode label */}
          <span className="hidden md:inline text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-sm font-medium">
            {mode === "examples" ? t("modeExamples", "en") : t("modeDialogue", "en")}
          </span>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title={t("settings", "en")}
            className={cn(
              "w-8 h-8 rounded-sm flex items-center justify-center transition-colors",
              isReady
                ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                : "text-destructive bg-destructive/10 animate-pulse"
            )}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="7.5" r="2.5" />
              <path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.2 3.2l1.4 1.4M10.4 10.4l1.4 1.4M3.2 11.8l1.4-1.4M10.4 4.6l1.4-1.4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate("/favorites")}
            title={t("favorites", "en")}
            className="relative w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2l1.85 3.75L14 6.5l-3 2.92.7 4.08L8 11.4l-3.7 2.1.7-4.08L2 6.5l4.15-.75z" />
            </svg>
            {favCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                {favCount > 99 ? "99+" : favCount}
              </span>
            )}
          </button>

          {/* Clear chat */}
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-sm"
            >
              {t("clearChat", "en")}
            </Button>
          )}
        </div>
      </header>

      {/* API not ready warning */}
      {!isReady && messages.length === 0 && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive text-center">
          {t("apiNotConfigured", "en")}
        </div>
      )}

      <MessageList
        messages={messages}
        onSpeak={speak}
        getTTSState={getState}
        onSendReply={handleSend}
      />

      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isLoading={isLoading}
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      <ApiSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Home;
