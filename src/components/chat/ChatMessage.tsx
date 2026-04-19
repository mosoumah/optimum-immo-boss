import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatAssistant";
import { escapeHtml } from "@/lib/escapeHtml";
import chatbotIcon from "@/assets/chatbot-icon.png";

interface ChatMessageProps {
  message: ChatMessageType;
}

const renderContent = (text: string) => {
  // Step 1: escape the raw text first
  const safe = escapeHtml(text);
  // Step 2: apply markdown patterns - captures are already escaped so safe to inject
  // Use non-greedy match and prevent newlines inside captures to avoid regex abuse
  let html = safe.replace(/\*\*([^*\n]{1,200}?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]{1,200}?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`\n]{1,500}?)`/g, '<code class="px-1 py-0.5 rounded text-xs font-mono" style="background: hsl(220, 18%, 15%)">$1</code>');
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
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      
      {!isUser &&
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/30 flex-shrink-0 mt-0.5 drop-shadow-[0_0_10px_hsl(72,100%,50%,0.2)]">
          <img alt="" className="w-full h-full object-cover object-center scale-[1.22]" src={chatbotIcon} />
        </div>
      }
      <div
        className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
        isUser
          ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_2px_20px_hsl(72,100%,50%,0.2)]"
          : "rounded-2xl rounded-tl-sm text-foreground"
        }`}
        style={!isUser ? {
          background: "linear-gradient(135deg, hsl(220, 20%, 13%) 0%, hsl(220, 18%, 10%) 100%)",
          border: "1px solid hsl(220, 15%, 18%)",
        } : undefined}
      >
        
        {isUser ?
        <p>{message.content}</p> :

        <div
          className="[&_strong]:font-semibold [&_em]:italic [&_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: renderContent(message.content) }} />

        }
      </div>
    </motion.div>);

};
