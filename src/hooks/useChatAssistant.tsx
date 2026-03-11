import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

const HISTORY_KEY = "chat-assistant-history";

const loadHistory = (): Conversation[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveHistory = (convos: Conversation[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(convos.slice(0, 20)));
};

export const useChatAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Conversation[]>(loadHistory);
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(null);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) {
        throw new Error(error.message || "Erreur de communication");
      }

      // Handle rate limit / payment errors from the response
      if (data?.error) {
        toast.error(data.error);
        setMessages(newMessages);
        setIsLoading(false);
        return;
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data?.response || "Je n'ai pas pu traiter votre demande.",
      };

      const updated = [...newMessages, assistantMsg];
      setMessages(updated);

      // Save to history
      const convoId = currentConvoId || crypto.randomUUID();
      if (!currentConvoId) setCurrentConvoId(convoId);

      const title = newMessages[0]?.content?.slice(0, 40) || "Conversation";
      const convo: Conversation = {
        id: convoId,
        title,
        messages: updated,
        createdAt: new Date().toISOString(),
      };

      const newHistory = [convo, ...history.filter((h) => h.id !== convoId)].slice(0, 20);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (e) {
      console.error("Chat error:", e);
      toast.error("Erreur lors de la communication avec l'assistant");
    } finally {
      setIsLoading(false);
    }
  }, [messages, history, currentConvoId]);

  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConvoId(null);
  }, []);

  const loadConversation = useCallback((convo: Conversation) => {
    setMessages(convo.messages);
    setCurrentConvoId(convo.id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
    if (currentConvoId === id) {
      setMessages([]);
      setCurrentConvoId(null);
    }
  }, [history, currentConvoId]);

  return {
    messages,
    isLoading,
    history,
    sendMessage,
    newConversation,
    loadConversation,
    deleteConversation,
  };
};
