import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatAssistant";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Simple markdown-like rendering without external dependency
const renderContent = (text: string) => {
  // Bold
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Code inline
  html = html.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-secondary text-xs">$1</code>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  return html;
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-gradient-to-br from-primary/30 to-accent/30 text-primary"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary/50 border border-border/30 text-foreground"
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div
            className="[&_strong]:font-semibold [&_em]:italic [&_code]:font-mono"
            dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
          />
        )}
      </div>
    </div>
  );
};
