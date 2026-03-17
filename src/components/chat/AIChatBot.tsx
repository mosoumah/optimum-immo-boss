import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  <div className="flex gap-2.5 items-start">
    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-primary/30 flex-shrink-0 drop-shadow-[0_0_10px_hsl(72,100%,50%,0.25)]">
      <img src={chatbotIcon} alt="" className="w-full h-full object-cover object-center scale-[1.22]" />
    </div>
    <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "linear-gradient(135deg, hsl(220, 20%, 13%) 0%, hsl(220, 18%, 10%) 100%)", border: "1px solid hsl(220, 15%, 18%)" }}>
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
    </div>
  </div>
);

export const AIChatBot = ({ userName }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("discussion");
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
    if (isOpen && activeTab === "discussion") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, activeTab]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const firstName = userName?.split(" ")[0] || "Utilisateur";

  return (
    <>
      {/* Floating button — dashboard icon */}
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
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full overflow-hidden flex items-center justify-center group ring-1 ring-primary/25"
          >
            {/* Orbital rings */}
            <span className="absolute inset-[-3px] rounded-full border border-primary/25 animate-[spin_8s_linear_infinite] opacity-50 group-hover:opacity-100 group-hover:border-primary/50 transition-opacity" />
            <span className="absolute inset-[-7px] rounded-full border border-primary/10 animate-[spin_12s_linear_infinite_reverse] opacity-30 group-hover:opacity-70 group-hover:border-primary/25 transition-opacity" />
            <img src={chatbotIcon} alt="Assistant IA" className="w-full h-full object-cover object-center scale-[1.22] relative z-10" />
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
            className="fixed bottom-6 right-6 z-50 w-[440px] h-[640px] rounded-3xl flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(220, 22%, 8%) 0%, hsl(220, 28%, 4%) 100%)",
              boxShadow: "0 0 50px hsl(72, 100%, 50%, 0.12), 0 0 100px hsl(72, 100%, 50%, 0.06), 0 25px 60px rgba(0,0,0,0.85)",
              border: "1px solid hsl(72, 100%, 50%, 0.12)",
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex-shrink-0 relative" style={{ background: "linear-gradient(180deg, hsl(220, 18%, 11%) 0%, hsl(220, 22%, 8%) 100%)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0 drop-shadow-[0_0_16px_hsl(72,100%,50%,0.25)]">
                    <img src={chatbotIcon} alt="" className="w-full h-full object-cover object-center scale-[1.22]" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">Assistant IA</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[11px] text-primary/80 font-medium tracking-wide">En ligne</span>
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
                  <p className="text-muted-foreground text-sm">
                    Bonjour{" "}
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                      {firstName}
                    </span>{" "}
                    👋
                  </p>
                  <p className="text-foreground font-semibold text-sm mt-0.5">
                    Comment puis-je vous aider ?
                  </p>
                </div>
              )}

              {/* Glow separator */}
              <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-5 pt-3 pb-1 flex-shrink-0">
                <TabsList className="w-full h-10 rounded-xl p-1 border border-border/15" style={{ background: "hsl(220, 20%, 7%)" }}>
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
                <ScrollArea className="flex-1 px-4 py-3">
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
                            style={{ background: "linear-gradient(135deg, hsl(220, 20%, 10%) 0%, hsl(220, 18%, 8%) 100%)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "linear-gradient(135deg, hsl(72, 60%, 15%, 0.15) 0%, hsl(220, 18%, 10%) 100%)";
                              e.currentTarget.style.borderColor = "hsl(72, 100%, 50%, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "linear-gradient(135deg, hsl(220, 20%, 10%) 0%, hsl(220, 18%, 8%) 100%)";
                              e.currentTarget.style.borderColor = "";
                            }}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border border-border/15" style={{ background: "hsl(220, 18%, 12%)" }}>
                              <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                            </div>
                            <span className="truncate font-medium">{s.text}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {messages.map((msg, i) => (
                        <ChatMessage key={i} message={msg} />
                      ))}
                      {isLoading && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="px-4 pb-3 pt-2 flex-shrink-0">
                  <div
                    className="flex gap-2 p-1.5 rounded-2xl border border-border/20 focus-within:border-primary/30 focus-within:shadow-[0_0_24px_hsl(72,100%,50%,0.08)] transition-all duration-300"
                    style={{ background: "hsl(220, 20%, 7%)" }}
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Posez votre question..."
                      disabled={isLoading}
                      className="flex-1 h-10 bg-transparent px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground hover:shadow-[0_0_24px_hsl(72,100%,50%,0.35)] transition-all duration-300 disabled:opacity-20"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Powered by AI footer */}
                  <div className="flex items-center justify-center gap-1 mt-2 opacity-40">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-medium tracking-wider">Propulsé par IA</span>
                  </div>
                </div>
              </TabsContent>

              {/* Historique tab */}
              <TabsContent
                value="historique"
                className="flex-1 min-h-0 mt-0 p-0"
              >
                <ScrollArea className="flex-1 h-full px-4 py-3">
                  {history.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-medium opacity-60">Aucun historique</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {history.map((convo) => (
                        <motion.div
                          key={convo.id}
                          whileHover={{ x: 2 }}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200 border border-transparent hover:border-primary/10"
                          style={{ background: "transparent" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "linear-gradient(135deg, hsl(72, 60%, 15%, 0.08) 0%, hsl(220, 18%, 8%) 100%)";
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
                            style={{ background: "linear-gradient(135deg, hsl(220, 18%, 12%) 0%, hsl(220, 20%, 9%) 100%)" }}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-foreground/90 group-hover:text-foreground transition-colors">
                              {convo.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {new Date(convo.createdAt).toLocaleDateString("fr-FR")}
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
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
