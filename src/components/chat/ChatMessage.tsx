import { memo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatAssistant";
import chatbotIcon from "@/assets/chatbot-icon.png";

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (assistantId: string) => void;
}

/**
 * Rendu des réponses de l'assistant : Markdown (GFM) rendu par react-markdown,
 * sans HTML brut — react-markdown échappe tout HTML présent dans le texte.
 * Styles alignés sur la bulle sombre du chat.
 */
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed break-words">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
  ul: ({ children }) => (
    <ul className="mb-2 last:mb-0 list-disc space-y-1 pl-4 marker:text-primary/70">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 last:mb-0 list-decimal space-y-1 pl-4 marker:text-primary/70">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mt-3 first:mt-0 mb-1 text-sm font-semibold text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 first:mt-0 mb-1 text-sm font-semibold text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 first:mt-0 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 last:mb-0 w-full overflow-x-auto rounded-lg border border-border/30">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="whitespace-nowrap bg-white/5 px-2 py-1.5 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border/20 px-2 py-1.5 align-top">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-2 last:mb-0 overflow-x-auto rounded-lg border border-border/30 bg-black/50 p-3 text-xs leading-relaxed [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-xs">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border/30" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="my-2 max-w-full rounded-lg" />
  ),
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
          <div className="break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ChatMessage = memo(ChatMessageImpl);
