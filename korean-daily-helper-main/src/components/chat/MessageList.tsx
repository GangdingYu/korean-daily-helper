import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TTSState } from "@/hooks/useTTS";
import { t } from "@/lib/i18n";
import { ChatMessage as ChatMessageType } from "@/types/types";
import ChatMessageComponent from "./ChatMessage";

interface MessageListProps {
  messages: ChatMessageType[];
  onSpeak: (id: string, text: string) => void;
  getTTSState: (id: string) => TTSState;
  onSendReply: (text: string) => void;
}

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8">
      <div className="w-14 h-14 rounded-sm bg-accent flex items-center justify-center mb-6">
        <span className="text-2xl font-bold text-accent-foreground">한</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{t("emptyStateTitle", "en")}</h2>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm leading-relaxed">
        {t("emptyStateDesc", "en")}
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <p className="text-xs font-medium text-foreground mb-2">
            {t("exampleModeLabel", "en")}
          </p>
          <div className="space-y-2 pl-2">
            <div className="border-l-2 border-ring pl-3 py-1">
              <p className="text-xs text-muted-foreground mb-0.5">{t("exampleModeDesc1", "en")}</p>
              <p className="text-sm text-foreground">&ldquo;{t("exampleModeDemo1", "en")}&rdquo;</p>
            </div>
            <div className="border-l-2 border-ring pl-3 py-1">
              <p className="text-xs text-muted-foreground mb-0.5">{t("exampleModeDesc2", "en")}</p>
              <p className="text-sm text-foreground">&ldquo;{t("exampleModeDemo2", "en")}&rdquo;</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground mb-2">
            {t("dialogueModeLabel", "en")}
          </p>
          <div className="space-y-2 pl-2">
            <div className="border-l-2 border-primary/50 pl-3 py-1">
              <p className="text-xs text-muted-foreground mb-0.5">{t("dialogueModeDesc1", "en")}</p>
              <p className="text-sm text-foreground">&ldquo;{t("dialogueModeDemo1", "en")}&rdquo;</p>
            </div>
            <div className="border-l-2 border-primary/50 pl-3 py-1">
              <p className="text-xs text-muted-foreground mb-0.5">{t("dialogueModeDesc2", "en")}</p>
              <p className="text-sm text-foreground korean-text">&ldquo;{t("dialogueModeDemo2", "en")}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSpeak,
  getTTSState,
  onSendReply,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 custom-scrollbar">
      <div className="px-4 md:px-8 py-4 max-w-3xl mx-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                getTTSState={getTTSState}
                onSpeak={onSpeak}
                onSendReply={onSendReply}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
