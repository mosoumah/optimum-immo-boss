import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
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
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMessage } from "./ChatMessage";
import { useChatAssistant, type Conversation } from "@/hooks/useChatAssistant";
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
  <div className="flex gap-2.5 items-start">
    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/30 flex-shrink-0 drop-shadow-[0_0_10px_hsl(72,100%,50%,0.25)]">
      <img
        src={chatbotIcon}
        alt=""
        className="w-full h-full object-cover object-center scale-[1.22]"
      />
    </div>
    <div
      className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 20%, 13%) 0%, hsl(220, 18%, 10%) 100%)",
        border: "1px solid hsl(220, 15%, 18%)",
      }}
    >
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/70"
            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <motion.span
        className="text-xs text-muted-foreground font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        Optimum Immo AI réfléchit…
      </motion.span>
    </div>
  </div>
);

const groupHistoryByDate = (history: Conversation[]) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: Record<string, Conversation[]> = {
    "Aujourd'hui": [],
    Hier: [],
    "Cette semaine": [],
    "Plus ancien": [],
  };

  for (const c of history) {
    const d = new Date(c.createdAt);
    if (d >= startOfToday) groups["Aujourd'hui"].push(c);
    else if (d >= startOfYesterday) groups["Hier"].push(c);
    else if (d >= startOfWeek) groups["Cette semaine"].push(c);
    else groups["Plus ancien"].push(c);
  }

  return Object.entries(groups).filter(([, list]) => list.length > 0);
};

export const AIChatBot = ({ userName }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("discussion");
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageCountRef = useRef(0);

  const {
    messages,
    isAssistantThinking,
    history,
    sendMessage,
    retryMessage,
    newConversation,
    loadConversation,
    deleteConversation,
  } = useChatAssistant();

  // Auto-resize textarea
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, 220);
    ta.style.height = `${Math.max(next, 48)}px`;
    ta.style.overflowY = ta.scrollHeight > 220 ? "auto" : "hidden";
  }, [input]);

  // Smart scroll
  useEffect(() => {
    const prev = lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;
    if (messages.length === 0) {
      setShowNewBadge(false);
      return;
    }
    const last = messages[messages.length - 1];
    const isNew = messages.length > prev;
    if (!isNew) return;
    if (!userScrolledUp || last.role === "user") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewBadge(false);
    } else {
      setShowNewBadge(true);
    }
  }, [messages, userScrolledUp]);

  useEffect(() => {
    if (isOpen && activeTab === "discussion") {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen, activeTab]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const up = distFromBottom > 80;
    setUserScrolledUp(up);
    if (!up) setShowNewBadge(false);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    sendMessage(trimmed);
    // After sending, force scroll to bottom on next tick
    setUserScrolledUp(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewBadge(false);
    setUserScrolledUp(false);
  };

  const firstName = userName?.split(" ")[0] || "Utilisateur";
  const groupedHistory = useMemo(() => groupHistoryByDate(history), [history]);

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -6, 0],
              filter: [
                "drop-shadow(0 0 12px hsl(72, 100%, 50%, 0.3)) drop-shadow(0 2px 10px rgba(0,0,0,0.3))",
                "drop-shadow(0 0 22px hsl(72, 100%, 50%, 0.5)) drop-shadow(0 2px 14px rgba(0,0,0,0.4))",
                "drop-shadow(0 0 12px hsl(72, 100%, 50%, 0.3)) drop-shadow(0 2px 10px rgba(0,0,0,0.3))",
              ],
            }}
            transition={{
              scale: { duration: 0.4 },
              opacity: { duration: 0.4 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              filter: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center group ring-1 ring-primary/30 backdrop-blur-xl"
          >
            <span className="absolute inset-[-3px] rounded-full border border-primary/25 animate-[spin_8s_linear_infinite] opacity-50 group-hover:opacity-100 group-hover:border-primary/50 transition-opacity" />
            <span className="absolute inset-[-7px] rounded-full border border-primary/10 animate-[spin_12s_linear_infinite_reverse] opacity-30 group-hover:opacity-70 group-hover:border-primary/25 transition-opacity" />
            <img
              src={chatbotIcon}
              alt="Assistant IA"
              className="w-full h-full object-cover object-center scale-[1.22] relative z-10"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-2 bottom-2 top-2 sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto z-50 sm:w-[440px] sm:max-w-[calc(100vw-1rem)] sm:h-[640px] sm:max-h-[calc(100vh-2rem)] rounded-3xl flex flex-col overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, hsl(220, 22%, 8%) 0%, hsl(220, 28%, 4%) 100%)",
              boxShadow:
                "0 0 50px hsl(72, 100%, 50%, 0.12), 0 0 100px hsl(72, 100%, 50%, 0.06), 0 25px 60px rgba(0,0,0,0.85)",
              border: "1px solid hsl(72, 100%, 50%, 0.12)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 pt-5 pb-4 flex-shrink-0 relative"
              style={{
                background:
                  "linear-gradient(180deg, hsl(220, 16%, 14%) 0%, hsl(220, 22%, 9%) 100%)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/40 flex-shrink-0 drop-shadow-[0_0_20px_hsl(72,100%,50%,0.35)]">
                    <img
                      src={chatbotIcon}
                      alt=""
                      className="w-full h-full object-cover object-center scale-[1.22]"
                    />
                  </div>
                  <div>
                    <span className="font-extrabold text-base text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-accent">
                      Assistant IA
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(72,100%,50%,0.6)]" />
                      <span className="text-xs text-primary/90 font-semibold tracking-wide">
                        En ligne
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
                    onClick={() => {
                      newConversation();
                      setActiveTab("discussion");
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {messages.length === 0 && activeTab === "discussion" && (
                <div className="mt-1">
                  <p className="text-muted-foreground text-base">
                    Bonjour{" "}
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                      {firstName}
                    </span>{" "}
                    👋
                  </p>
                  <p className="text-foreground font-bold text-base mt-0.5">
                    Comment puis-je vous aider ?
                  </p>
                </div>
              )}

              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_8px_hsl(72,100%,50%,0.2)]" />
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-5 pt-3 pb-1 flex-shrink-0">
                <TabsList
                  className="w-full h-10 rounded-xl p-1 border border-border/15"
                  style={{ background: "hsl(220, 20%, 7%)" }}
                >
                  <TabsTrigger
                    value="discussion"
                    className="h-8 text-xs rounded-lg flex-1 gap-1.5 font-medium data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(72,100%,50%,0.1)] transition-all duration-200"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Discussion
                  </TabsTrigger>
                  <TabsTrigger
                    value="historique"
                    className="h-8 text-xs rounded-lg flex-1 gap-1.5 font-medium data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(72,100%,50%,0.1)] transition-all duration-200"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Historique
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Discussion tab */}
              <TabsContent
                value="discussion"
                className="flex-1 flex flex-col min-h-0 mt-0 p-0"
              >
                <div className="flex-1 min-h-0 relative">
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto px-4 py-3 scroll-smooth"
                  >
                    {messages.length === 0 ? (
                      <div className="grid grid-cols-2 gap-2.5 pt-2">
                        {suggestions.map((s) => {
                          const Icon = s.icon;
                          return (
                            <motion.button
                              key={s.text}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => sendMessage(s.text)}
                              className="flex items-center gap-2.5 text-left text-xs px-3.5 py-3 rounded-xl border border-border/20 text-foreground/80 hover:text-primary transition-all duration-300 group"
                              style={{
                                background:
                                  "linear-gradient(135deg, hsl(220, 20%, 10%) 0%, hsl(220, 18%, 8%) 100%)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "linear-gradient(135deg, hsl(72, 60%, 15%, 0.15) 0%, hsl(220, 18%, 10%) 100%)";
                                e.currentTarget.style.borderColor =
                                  "hsl(72, 100%, 50%, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "linear-gradient(135deg, hsl(220, 20%, 10%) 0%, hsl(220, 18%, 8%) 100%)";
                                e.currentTarget.style.borderColor = "";
                              }}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border border-border/15"
                                style={{ background: "hsl(220, 18%, 12%)" }}
                              >
                                <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                              </div>
                              <span className="truncate font-medium">{s.text}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {messages.map((msg) => (
                          <ChatMessage
                            key={msg.id}
                            message={msg}
                            onRetry={retryMessage}
                          />
                        ))}
                        {isAssistantThinking && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* New message badge */}
                  <AnimatePresence>
                    {showNewBadge && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-[0_0_20px_hsl(72,100%,50%,0.4)] hover:scale-105 transition-transform"
                      >
                        <ArrowDown className="w-3 h-3" />
                        Nouveau message
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input */}
                <div className="px-4 pb-3 pt-2 flex-shrink-0">
                  <div
                    className="flex gap-2 items-end p-1.5 rounded-2xl border border-border/20 focus-within:border-primary/30 focus-within:shadow-[0_0_24px_hsl(72,100%,50%,0.08)] transition-all duration-300"
                    style={{ background: "hsl(220, 20%, 7%)" }}
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Posez votre question... (Shift+Enter pour aller à la ligne)"
                      rows={1}
                      className="flex-1 bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none resize-none leading-relaxed"
                      style={{ minHeight: "48px", maxHeight: "220px" }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground hover:shadow-[0_0_24px_hsl(72,100%,50%,0.35)] transition-all duration-300 disabled:opacity-30 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2 opacity-40">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-medium tracking-wider">
                      Propulsé par IA
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Historique tab */}
              <TabsContent
                value="historique"
                className="flex-1 min-h-0 mt-0 p-0 overflow-hidden"
              >
                <div className="h-full overflow-y-auto px-4 py-3">
                  {history.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-medium opacity-60">
                        Aucun historique
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedHistory.map(([label, convos]) => (
                        <div key={label}>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5 px-1">
                            {label}
                          </p>
                          <div className="space-y-1.5">
                            {convos.map((convo) => (
                              <motion.div
                                key={convo.id}
                                whileHover={{ x: 2 }}
                                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200 border border-transparent hover:border-primary/10"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "linear-gradient(135deg, hsl(72, 60%, 15%, 0.08) 0%, hsl(220, 18%, 8%) 100%)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                                onClick={() => {
                                  loadConversation(convo);
                                  setActiveTab("discussion");
                                }}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-border/15"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, hsl(220, 18%, 12%) 0%, hsl(220, 20%, 9%) 100%)",
                                  }}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate text-foreground/90 group-hover:text-foreground transition-colors">
                                    {convo.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                    {new Date(convo.createdAt).toLocaleDateString(
                                      "fr-FR"
                                    )}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(convo.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
