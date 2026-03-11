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
  <div className="flex gap-2 items-start">
    <div className="w-8 h-8 rounded-xl bg-card/60 backdrop-blur-sm border border-border/30 flex items-center justify-center flex-shrink-0">
      <img src={chatbotIcon} alt="" className="w-5 h-5 object-contain" />
    </div>
    <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/70"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
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
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl flex items-center justify-center group"
            style={{
              background: "linear-gradient(145deg, hsl(220, 18%, 14%), hsl(220, 20%, 8%))",
              boxShadow: "0 0 30px hsl(72, 100%, 50%, 0.25), 0 0 60px hsl(72, 100%, 50%, 0.1), 0 8px 32px hsl(220, 30%, 4%, 0.5)",
              border: "1px solid hsl(72, 100%, 50%, 0.2)",
            }}
          >
            {/* Orbital ring */}
            <span className="absolute inset-[-3px] rounded-[18px] border border-primary/20 animate-[spin_8s_linear_infinite] opacity-60 group-hover:opacity-100 group-hover:border-primary/40 transition-opacity" />
            <img src={chatbotIcon} alt="Assistant IA" className="w-9 h-9 object-contain relative z-10 drop-shadow-[0_0_8px_hsl(72,100%,50%,0.4)]" />
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
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[580px] rounded-3xl flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(220, 20%, 9%) 0%, hsl(220, 25%, 5%) 100%)",
              boxShadow: "0 0 40px hsl(72, 100%, 50%, 0.15), 0 25px 60px rgba(0,0,0,0.8)",
              border: "1px solid hsl(72, 100%, 50%, 0.15)",
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ background: "linear-gradient(180deg, hsl(220, 18%, 12%) 0%, hsl(220, 20%, 9%) 100%)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card border border-primary/20 flex items-center justify-center shadow-[0_0_20px_hsl(72,100%,50%,0.15)]">
                    <img src={chatbotIcon} alt="" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-foreground">Assistant IA</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[11px] text-primary/80 font-medium">En ligne</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
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
                    className="h-8 w-8 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-5 flex-shrink-0">
                <TabsList className="w-full h-9 bg-card rounded-xl p-1 border border-border/20">
                  <TabsTrigger
                    value="discussion"
                    className="h-7 text-xs rounded-lg flex-1 gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Discussion
                  </TabsTrigger>
                  <TabsTrigger
                    value="historique"
                    className="h-7 text-xs rounded-lg flex-1 gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
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
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {suggestions.map((s) => {
                        const Icon = s.icon;
                        return (
                          <motion.button
                            key={s.text}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => sendMessage(s.text)}
                            className="flex items-center gap-2 text-left text-xs px-3 py-2.5 rounded-xl border border-border/30 bg-card hover:bg-primary/10 hover:border-primary/30 text-foreground/80 hover:text-primary transition-all duration-200 group"
                          >
                            <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                            <span className="truncate">{s.text}</span>
                          </motion.button>
                        );
                      })}
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
                <div className="px-4 pb-4 pt-2 flex-shrink-0">
                  <div
                    className="flex gap-2 p-1 rounded-2xl border border-border/30 bg-card focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsl(72,100%,50%,0.1)] transition-all duration-300"
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Posez votre question..."
                      disabled={isLoading}
                      className="flex-1 h-9 bg-transparent px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground hover:shadow-[0_0_20px_hsl(72,100%,50%,0.3)] transition-all duration-200 disabled:opacity-30"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
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
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-xs">Aucun historique</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {history.map((convo) => (
                        <motion.div
                          key={convo.id}
                          whileHover={{ x: 2 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-card/50 cursor-pointer group transition-colors border border-transparent hover:border-border/20"
                          onClick={() => {
                            loadConversation(convo);
                            setActiveTab("discussion");
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-card/60 border border-border/20 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-foreground/90">
                              {convo.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                              {new Date(convo.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
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
