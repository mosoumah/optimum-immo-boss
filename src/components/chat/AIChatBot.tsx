import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { useChatAssistant } from "@/hooks/useChatAssistant";

interface AIChatBotProps {
  userName?: string;
}

const suggestions = [
  "Créer un client",
  "Voir les factures impayées",
  "Voir le bénéfice du mois",
  "Voir les réservations de la semaine",
  "Créer une tâche",
  "Voir les biens disponibles",
];

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

  const handleSuggestion = (text: string) => {
    sendMessage(text);
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:shadow-primary/40 transition-shadow"
          >
            <Sparkles className="w-6 h-6" />
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
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-border/30 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-sm">Assistant IA</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-secondary/50"
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
                    className="h-7 w-7 rounded-lg hover:bg-secondary/50"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {messages.length === 0 && activeTab === "discussion" && (
                <p className="text-sm text-muted-foreground">
                  Bonjour {firstName} 👋
                  <br />
                  <span className="text-foreground font-medium">
                    Comment puis-je vous aider aujourd'hui ?
                  </span>
                </p>
              )}
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="mx-4 mt-2 h-8 bg-secondary/30 rounded-lg p-0.5">
                <TabsTrigger
                  value="discussion"
                  className="h-7 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Discussion
                </TabsTrigger>
                <TabsTrigger
                  value="historique"
                  className="h-7 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Historique
                </TabsTrigger>
              </TabsList>

              {/* Discussion tab */}
              <TabsContent
                value="discussion"
                className="flex-1 flex flex-col min-h-0 mt-0 p-0"
              >
                <ScrollArea className="flex-1 px-4 py-2">
                  {messages.length === 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestion(s)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border/40 bg-secondary/20 hover:bg-primary/10 hover:border-primary/40 text-foreground/80 hover:text-primary transition-all duration-200"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, i) => (
                        <ChatMessage key={i} message={msg} />
                      ))}
                      {isLoading && (
                        <div className="flex gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          </div>
                          <div className="bg-secondary/50 border border-border/30 rounded-xl px-3 py-2 text-sm text-muted-foreground">
                            Réflexion en cours...
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="px-3 pb-3 pt-2 border-t border-border/20 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Posez votre question..."
                      disabled={isLoading}
                      className="flex-1 h-9 rounded-xl border border-border/40 bg-secondary/20 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 transition-all"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 transition-colors"
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
                <ScrollArea className="flex-1 h-full px-4 py-2">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Aucun historique</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {history.map((convo) => (
                        <div
                          key={convo.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 cursor-pointer group transition-colors"
                          onClick={() => {
                            loadConversation(convo);
                            setActiveTab("discussion");
                          }}
                        >
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {convo.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(convo.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(convo.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
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
