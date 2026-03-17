import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Plus,
  Trash2,
  Clock,
  UserPlus,
  FileText,
  TrendingUp,
  Calendar,
  CheckSquare,
  Building,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { useChatAssistant } from "@/hooks/useChatAssistant";
import chatbotIcon from "@/assets/chatbot-icon.png";

interface AIChatBotProps {
  userName?: string;
}

const suggestions = [
  { text: "Créer un client", icon: UserPlus },
  { text: "Factures impayées", icon: FileText },
  { text: "Bénéfice du mois", icon: TrendingUp },
  { text: "Réservations semaine", icon: Calendar },
  { text: "Créer une tâche", icon: CheckSquare },
  { text: "Biens disponibles", icon: Building },
];

const TypingIndicator = () => (
  <div className="flex gap-2 items-start">
    <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-primary/30 flex-shrink-0">
      <img src={chatbotIcon} alt="" className="w-full h-full object-cover object-center scale-[1.22]" />
    </div>
    <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 bg-muted/50 border border-border/30">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/70"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const AIChatBot = ({ userName }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeView, setActiveView] = useState<"chat" | "history">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    history,
    sendMessage,
    newConversation,
    loadConversation,
    deleteConversation,
  } = useChatAssistant();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && activeView === "chat") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, activeView]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const firstName = userName?.split(" ")[0] || "Utilisateur";

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
          >
            <img src={chatbotIcon} alt="ImmoPilot" className="w-full h-full object-cover object-center scale-[1.22] relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 right-5 z-50 w-[380px] rounded-2xl flex flex-col overflow-hidden border border-border/30 shadow-2xl"
            style={{
              height: "min(580px, calc(100vh - 40px))",
              background: "hsl(var(--background))",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/30 flex-shrink-0 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/25 flex-shrink-0">
                  <img src={chatbotIcon} alt="" className="w-full h-full object-cover object-center scale-[1.22]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-tight">ImmoPilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">En ligne</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    newConversation();
                    setActiveView("chat");
                  }}
                  title="Nouvelle conversation"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => setActiveView(activeView === "chat" ? "history" : "chat")}
                  title="Historique"
                >
                  <Clock className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Body */}
            {activeView === "chat" ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages area */}
                <ScrollArea className="flex-1 px-3 py-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col h-full">
                      {/* Welcome */}
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">
                          Bonjour <span className="font-semibold text-primary">{firstName}</span> 👋
                        </p>
                        <p className="text-foreground font-medium text-sm mt-1">
                          Comment puis-je vous aider ?
                        </p>
                      </div>
                      {/* Suggestions grid */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {suggestions.map((s) => {
                          const Icon = s.icon;
                          return (
                            <button
                              key={s.text}
                              onClick={() => sendMessage(s.text)}
                              className="flex items-center gap-2 text-left text-xs px-3 py-2.5 rounded-xl border border-border/30 text-foreground/80 hover:text-primary hover:border-primary/25 hover:bg-primary/5 transition-all duration-200"
                            >
                              <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{s.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, i) => (
                        <ChatMessage key={i} message={msg} />
                      ))}
                      {isLoading && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-border/20">
                  <div className="flex gap-2 items-center p-1 rounded-xl border border-border/30 focus-within:border-primary/30 bg-muted/20 transition-colors">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Posez votre question..."
                      disabled={isLoading}
                      className="flex-1 h-9 bg-transparent px-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-20 flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1.5 opacity-40">
                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[9px] text-muted-foreground tracking-wider">Propulsé par IA</span>
                  </div>
                </div>
              </div>
            ) : (
              /* History view */
              <ScrollArea className="flex-1 px-3 py-3">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs opacity-60">Aucun historique</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {history.map((convo) => (
                      <div
                        key={convo.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer group hover:bg-muted/40 transition-colors"
                        onClick={() => {
                          loadConversation(convo);
                          setActiveView("chat");
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-foreground/90">{convo.title}</p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {new Date(convo.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(convo.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
