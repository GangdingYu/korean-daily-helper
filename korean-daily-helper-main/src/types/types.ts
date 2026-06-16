// 聊天模式
export type ChatMode = "examples" | "dialogue";

// 收藏来源
export type FavoriteSource = "examples" | "dialogue";

// 收藏条目
export interface FavoriteItem {
  id: string;
  korean: string;
  translation: string;
  savedAt: string;
  source: FavoriteSource;
}

// 消息角色类型
export type MessageRole = "user" | "assistant";

// 聊天消息类型
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  mode?: ChatMode;
}

// 聊天状态
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// API消息格式
export interface ApiMessage {
  role: MessageRole;
  content: string;
}
