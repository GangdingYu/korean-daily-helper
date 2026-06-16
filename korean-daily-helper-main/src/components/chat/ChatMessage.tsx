import React from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { TTSState } from "@/hooks/useTTS";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { FavoriteSource } from "@/types/types";
import { ChatMessage as ChatMessageType } from "@/types/types";

interface ChatMessageProps {
  message: ChatMessageType;
  getTTSState?: (id: string) => TTSState;
  onSpeak?: (id: string, text: string) => void;
  onSendReply?: (text: string) => void;
}

interface ContentBlock {
  type: "korean" | "text" | "translation";
  content: string;
  id: string;
}

interface SuggestedReply {
  korean: string;
  translation: string;
  id: string;
}

function splitDialogueContent(content: string): { main: string; suggestions: string | null } {
  const marker = "💡";
  const idx = content.indexOf(marker);
  if (idx === -1) return { main: content, suggestions: null };
  return {
    main: content.slice(0, idx).trimEnd(),
    suggestions: content.slice(idx),
  };
}

function parseSuggestions(raw: string, messageId: string): SuggestedReply[] {
  const results: SuggestedReply[] = [];
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  let pending: string | null = null;
  let idx = 0;

  for (const line of lines) {
    if (line.startsWith("💡") || line.includes("You can say")) {
      continue;
    }
    if (line.startsWith("「Translation")) {
      if (pending !== null) {
        results.push({
          korean: pending,
          translation: line.replace(/^「Translation」/, "").trim(),
          id: `${messageId}-reply-${idx++}`,
        });
        pending = null;
      }
      continue;
    }
    const koreanCount = (line.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
    if (koreanCount >= 2) {
      pending = line.replace(/^\d+[.、．]\s*/, "").trim();
    }
  }
  return results;
}

function parseBlocks(content: string, messageId: string): ContentBlock[] {
  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];
  let koreanIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== "text") {
        blocks.push({ type: "text", content: "", id: "" });
      }
      continue;
    }
    if (trimmed.startsWith("「Translation")) {
      blocks.push({ type: "translation", content: trimmed.replace(/^「Translation」/, "").trim(), id: "" });
      continue;
    }
    const koreanCount = (trimmed.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
    const isTitleLine = /^[🗣📝💬📌✨🌟💡🔹]/.test(trimmed);
    if (koreanCount >= 3 && !isTitleLine) {
      blocks.push({
        type: "korean",
        content: trimmed.replace(/^\d+[.、．]\s*/, "").trim(),
        id: `${messageId}-ko-${koreanIndex++}`,
      });
    } else {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "text" && last.content !== "") {
        last.content += "\n" + trimmed;
      } else {
        blocks.push({ type: "text", content: trimmed, id: "" });
      }
    }
  }
  return blocks;
}

function renderTextLine(line: string): React.ReactNode {
  const boldRegex = /\*\*(.+?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m;
  while ((m = boldRegex.exec(line)) !== null) {
    if (m.index > last) parts.push(<span key={last}>{line.slice(last, m.index)}</span>);
    parts.push(<strong key={m.index} className="font-semibold">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(<span key={last}>{line.slice(last)}</span>);
  return parts.length > 0 ? parts : line;
}

const FavoriteButton: React.FC<{
  korean: string;
  translation: string;
  source: FavoriteSource;
  small?: boolean;
}> = ({ korean, translation, source, small }) => {
  const { isFavorited, toggleFavorite } = useFavorites();
  const faved = isFavorited(korean);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(korean, translation, source);
      }}
      title={faved ? t("unfavorite", "en") : t("favorite", "en")}
      className={cn(
        "flex-shrink-0 rounded-sm flex items-center justify-center transition-all duration-150",
        small ? "w-5 h-5" : "w-6 h-6",
        faved
          ? "text-primary scale-110"
          : "text-muted-foreground hover:text-primary hover:bg-accent"
      )}
    >
      {faved ? (
        <svg width={small ? 11 : 13} height={small ? 11 : 13} viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 1l1.63 3.3 3.64.53-2.63 2.57.62 3.62L7 9.25l-3.26 1.77.62-3.62L1.73 4.83l3.64-.53z" />
        </svg>
      ) : (
        <svg width={small ? 11 : 13} height={small ? 11 : 13} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 1l1.63 3.3 3.64.53-2.63 2.57.62 3.62L7 9.25l-3.26 1.77.62-3.62L1.73 4.83l3.64-.53z" />
        </svg>
      )}
    </button>
  );
};

const SpeakButton: React.FC<{ state: TTSState; onClick: () => void; small?: boolean }> = ({
  state, onClick, small,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={state === "playing" ? t("ttsStop", "en") : t("ttsPlay", "en")}
      className={cn(
      "flex-shrink-0 rounded-sm flex items-center justify-center transition-colors duration-150",
      small ? "w-5 h-5" : "w-6 h-6",
      state === "playing"
        ? "bg-accent text-ring"
        : state === "loading"
          ? "text-muted-foreground opacity-60 cursor-wait"
          : "text-muted-foreground hover:text-ring hover:bg-accent"
    )}
  >
    {state === "loading" ? (
      <span className={cn(
        "animate-spin inline-block border border-current border-t-transparent rounded-full",
        small ? "w-2.5 h-2.5" : "w-3 h-3"
      )} />
    ) : state === "playing" ? (
      <svg width={small ? 8 : 10} height={small ? 8 : 10} viewBox="0 0 10 10" fill="currentColor">
        <rect x="1.5" y="1" width="2.5" height="8" rx="0.5" />
        <rect x="6" y="1" width="2.5" height="8" rx="0.5" />
      </svg>
    ) : (
      <svg width={small ? 8 : 10} height={small ? 8 : 10} viewBox="0 0 10 10" fill="currentColor">
        <path d="M2 1.5l7 3.5-7 3.5V1.5z" />
      </svg>
    )}
  </button>
  );
};

const StructuredContent: React.FC<{
  content: string;
  messageId: string;
  source: FavoriteSource;
  getTTSState: (id: string) => TTSState;
  onSpeak: (id: string, text: string) => void;
}> = ({ content, messageId, source, getTTSState, onSpeak }) => {
  const blocks = parseBlocks(content, messageId);
  return (
    <div className="space-y-1 leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          if (!block.content) return <div key={idx} className="h-3" />;
          return (
            <div key={idx} className="text-sm leading-relaxed">
              {block.content.split("\n").map((line, li) => (
                <div key={li} className={cn(
                  /^[🗣📝💬📌✨🌟💡🔹]/.test(line) && "mt-4 mb-1 font-medium text-foreground"
                )}>
                  {renderTextLine(line)}
                </div>
              ))}
            </div>
          );
        }
        if (block.type === "translation") {
          return (
            <div key={idx} className="text-xs text-muted-foreground pl-3 ml-1 mt-1 mb-3 border-l-2 border-ring/30 py-1 leading-relaxed">
              {block.content}
            </div>
          );
        }
        const ttsState = getTTSState(block.id);
        const nextBlock = blocks[idx + 1];
        const translation = nextBlock?.type === "translation"
          ? nextBlock.content.trim()
          : "";
        return (
          <div key={block.id} className="group flex items-start gap-2 py-2 px-3 rounded-md bg-accent/10 hover:bg-accent/20 transition-colors mb-1">
            <span className="flex-1 korean-text text-sm leading-relaxed">{block.content}</span>
            <SpeakButton state={ttsState} onClick={() => onSpeak(block.id, block.content)} />
            <FavoriteButton korean={block.content} translation={translation} source={source} />
          </div>
        );
      })}
    </div>
  );
};

const SuggestedReplies: React.FC<{
  replies: SuggestedReply[];
  getTTSState: (id: string) => TTSState;
  onSpeak: (id: string, text: string) => void;
  onSendReply: (text: string) => void;
}> = ({ replies, getTTSState, onSpeak, onSendReply }) => {
  if (replies.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-border/60">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{t("youCanReply", "en")}</p>
      <div className="flex flex-col gap-2">
        {replies.map((reply) => {
          const ttsState = getTTSState(reply.id);
          const translation = reply.translation.trim();
          return (
            <button
              key={reply.id}
              type="button"
              onClick={() => onSendReply(reply.korean)}
              className={cn(
                "group w-full text-left px-3 py-2.5 rounded-sm",
                "border border-border bg-background",
                "hover:border-ring hover:bg-accent/40",
                "transition-all duration-150",
                "flex items-start gap-2"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="korean-text text-sm font-medium text-foreground leading-snug">{reply.korean}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{reply.translation}</p>
              </div>
              <div className="flex items-center gap-1 pt-0.5 flex-shrink-0">
                <SpeakButton
                  state={ttsState}
                  small
                  onClick={() => onSpeak(reply.id, reply.korean)}
                />
                <FavoriteButton
                  korean={reply.korean}
                  translation={translation}
                  source="dialogue"
                  small
                />
                <span className="text-muted-foreground group-hover:text-ring transition-colors">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6h8M7 3l3 3-3 3" />
                  </svg>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function renderStreamingContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, idx) => {
    const isLast = idx === lines.length - 1;
    const isTitleLine = /^[🗣📝💬📌✨🌟💡🔹]/.test(line.trim());
    const koreanCount = (line.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
    const hasKorean = koreanCount >= 3 && !isTitleLine;
    const isTranslation = line.trim().startsWith("「Translation");
    const displayLine = isTranslation ? line.replace(/^「Translation」/, "").trim() : line;
    return (
      <React.Fragment key={idx}>
        <span className={cn(
          "block",
          hasKorean && "korean-text font-medium",
          isTitleLine && "mt-4 mb-1 font-medium",
          isTranslation && "text-xs text-muted-foreground pl-3 ml-1 border-l-2 border-ring/30",
          !line && "h-3"
        )}>
          {displayLine}
          {isLast && <span className="typing-cursor" />}
        </span>
        {line && !isTitleLine && <span className="block" />}
      </React.Fragment>
    );
  });
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  getTTSState = () => "idle",
  onSpeak,
  onSendReply,
}) => {
  const isUser = message.role === "user";
  const isDialogue = message.mode === "dialogue";

  const { main: mainContent, suggestions: suggestionsRaw } =
    !isUser && isDialogue && !message.isStreaming
      ? splitDialogueContent(message.content)
      : { main: message.content, suggestions: null };

  const suggestedReplies = suggestionsRaw
    ? parseSuggestions(suggestionsRaw, message.id)
    : [];

  return (
    <div className={cn("flex message-enter", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-ring/15 flex items-center justify-center mr-3 mt-0.5">
          <span className="text-sm font-bold text-ring">한</span>
        </div>
      )}

      <div className={cn(
        "px-4 py-3 rounded-sm text-sm max-w-[82%] md:max-w-[75%]",
        isUser
          ? "bg-primary text-primary-foreground ml-10"
          : "bg-card border border-border text-foreground shadow-card"
      )}>
        {isUser ? (
          <span>{message.content}</span>
        ) : message.isStreaming ? (
          <div className="leading-7">
            {renderStreamingContent(message.content)}
            {message.content === "" && (
              <span className="text-muted-foreground text-xs">...</span>
            )}
          </div>
        ) : (
          <>
            {onSpeak ? (
              <StructuredContent
                content={mainContent}
                messageId={message.id}
                source={isDialogue ? "dialogue" : "examples"}
                getTTSState={getTTSState}
                onSpeak={onSpeak}
              />
            ) : (
              <div className="leading-7">{renderStreamingContent(mainContent)}</div>
            )}
            {isDialogue && suggestedReplies.length > 0 && onSendReply && onSpeak && (
              <SuggestedReplies
                replies={suggestedReplies}
                getTTSState={getTTSState}
                onSpeak={onSpeak}
                onSendReply={onSendReply}
              />
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-secondary flex items-center justify-center ml-3 mt-0.5">
          <span className="text-sm font-medium text-secondary-foreground">Me</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessageComponent;
