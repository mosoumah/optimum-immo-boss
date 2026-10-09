import { memo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatAssistant";
import { escapeHtml } from "@/lib/escapeHtml";
import chatbotIcon from "@/assets/chatbot-icon.png";

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (assistantId: string) => void;
}

const renderContent = (text: string) => {
  const safe = escapeHtml(text);
  let html = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(
    /`(.*?)`/g,
    '<code class="px-1 py-0.5 rounded text-xs font-mono" style="background: hsl(220, 18%, 15%)">$1</code>'
  );
  html = html.replace(/\n/g, "<br/>");
  return html;
};

const ChatMessageImpl = ({ message, onRetry }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const isFailed = message.status === "failed";
  const isSending = isUser && message.status === "sending";

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 12 : -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/30 flex-shrink-0 mt-0.5 drop-shadow-[0_0_10px_hsl(72,100%,50%,0.2)]">
          <img
            alt=""
            className="w-full h-full object-cover object-center scale-[1.22]"
            src={chatbotIcon}
          />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed relative ${
          isUser
            ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_2px_20px_hsl(72,100%,50%,0.2)]"
            : "rounded-2xl rounded-tl-sm text-foreground"
        } ${isSending ? "opacity-70" : ""} ${
          isFailed ? "border border-destructive/40" : ""
        }`}
        style={
          !isUser
            ? {
                background: isFailed
                  ? "linear-gradient(135deg, hsl(0, 40%, 12%) 0%, hsl(220, 18%, 10%) 100%)"
                  : "linear-gradient(135deg, hsl(220, 20%, 13%) 0%, hsl(220, 18%, 10%) 100%)",
                border: isFailed
                  ? "1px solid hsl(0, 70%, 45%, 0.5)"
                  : "1px solid hsl(220, 15%, 18%)",
              }
            : undefined
        }
      >
        {isUser ? (
          <div className="flex items-center gap-2">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {isSending && (
              <Loader2 className="w-3 h-3 animate-spin opacity-70 flex-shrink-0" />
            )}
          </div>
        ) : isFailed ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Échec de la réponse</span>
            </div>
            {message.error && (
              <p className="text-xs text-muted-foreground">{message.error}</p>
            )}
            {onRetry && (
              <button
                onClick={() => onRetry(message.id)}
                className="self-start mt-1 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Réessayer
              </button>
            )}
          </div>
        ) : (
          <div
            className="[&_strong]:font-semibold [&_em]:italic [&_code]:font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
          />
        )}
      </div>
    </motion.div>
  );
};

export const ChatMessage = memo(ChatMessageImpl);
