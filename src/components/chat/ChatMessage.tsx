import { motion } from "framer-motion";
import { User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatAssistant";
import chatbotIcon from "@/assets/chatbot-icon.png";

interface ChatMessageProps {
  message: ChatMessageType;
}

const renderContent = (text: string) => {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-secondary/60 text-xs font-mono">$1</code>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 12 : -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <img src={chatbotIcon} alt="" className="w-7 h-7 object-contain drop-shadow-[0_0_6px_hsl(72,100%,50%,0.3)]" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_2px_16px_hsl(72,100%,50%,0.2)]"
            : "bg-card border border-border/30 text-foreground"
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
    </motion.div>
  );
};
