import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MessageStatus = "sending" | "processing" | "completed" | "failed";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  createdAt: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

const HISTORY_KEY = "chat-assistant-history";
const MAX_HISTORY = 20;
const MAX_MESSAGES_PER_CONV = 100;
const MAX_CONTENT_LENGTH = 10000;

const isValidRole = (r: unknown): r is "user" | "assistant" =>
  r === "user" || r === "assistant";

const isValidStatus = (s: unknown): s is MessageStatus =>
  s === "sending" || s === "processing" || s === "completed" || s === "failed";

const loadHistory = (): Conversation[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, MAX_HISTORY).map((c: Record<string, unknown>) => {
      const createdAt = typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString();
      const messages = ((c.messages as Record<string, unknown>[] | undefined) || [])
        .slice(0, MAX_MESSAGES_PER_CONV)
        .filter((m: Record<string, unknown>) => isValidRole(m.role))
        .map((m: Record<string, unknown>) => ({
          id: typeof m.id === "string" ? m.id : crypto.randomUUID(),
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string" ? m.content.slice(0, MAX_CONTENT_LENGTH) : "",
          status: isValidStatus(m.status) ? m.status : "completed",
          createdAt: typeof m.createdAt === "string" ? m.createdAt : createdAt,
          error: typeof m.error === "string" ? m.error : undefined,
        }));
      return {
        id: typeof c.id === "string" ? c.id : crypto.randomUUID(),
        title: typeof c.title === "string" ? c.title : messages.find((m) => m.role === "user")?.content?.slice(0, 40) || "Conversation",
        messages,
        createdAt,
      };
    });
  } catch {
    return [];
  }
};

const saveHistory = (convos: Conversation[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(convos.slice(0, MAX_HISTORY)));
};

export const useChatAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<Conversation[]>(loadHistory);
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(null);

  // Refs for queue worker (avoid stale closures)
  const messagesRef = useRef<ChatMessage[]>([]);
  const queueRef = useRef<string[]>([]); // user message ids waiting to be processed
  const processingRef = useRef(false);
  const historyRef = useRef<Conversation[]>(history);
  const convoIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    convoIdRef.current = currentConvoId;
  }, [currentConvoId]);

  const isAssistantThinking = messages.some(
    (m) => m.role === "assistant" && m.status === "processing"
  );

  const persistConvo = useCallback((msgs: ChatMessage[]) => {
    const completed = msgs.filter((m) => m.status === "completed");
    if (completed.length === 0) return;
    const convoId = convoIdRef.current || crypto.randomUUID();
    if (!convoIdRef.current) {
      convoIdRef.current = convoId;
      setCurrentConvoId(convoId);
    }
    const firstUser = completed.find((m) => m.role === "user");
    const title = firstUser?.content?.slice(0, 40) || "Conversation";
    const convo: Conversation = {
      id: convoId,
      title,
      messages: completed,
      createdAt: new Date().toISOString(),
    };
    const newHistory = [
      convo,
      ...historyRef.current.filter((h) => h.id !== convoId),
    ].slice(0, 20);
    setHistory(newHistory);
    saveHistory(newHistory);
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const userMsgId = queueRef.current.shift();
    if (!userMsgId) return;
    processingRef.current = true;

    // Find the user message
    const userMsg = messagesRef.current.find((m) => m.id === userMsgId);
    if (!userMsg) {
      processingRef.current = false;
      void processQueue();
      return;
    }

    // Mark user as completed and add a processing assistant placeholder
    const assistantId = crypto.randomUUID();
    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === userMsgId ? { ...m, status: "completed" as MessageStatus } : m
      );
      return [
        ...updated,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          status: "processing",
          createdAt: new Date().toISOString(),
        },
      ];
    });

    try {
      // Build payload from completed messages + this user msg
      const payload = messagesRef.current
        .filter(
          (m) =>
            m.status === "completed" ||
            m.id === userMsgId ||
            (m.role === "user" && m.status === "sending")
        )
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: { messages: payload },
      });

      if (error) throw new Error(error.message || "Erreur de communication");
      if (data?.error) throw new Error(data.error);

      const responseText = data?.response || "Je n'ai pas pu traiter votre demande.";

      let snapshot: ChatMessage[] = [];
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: responseText, status: "completed" as MessageStatus }
            : m
        );
        snapshot = updated;
        return updated;
      });
      // Persist outside the updater to avoid setState-in-render warnings
      setTimeout(() => persistConvo(snapshot), 0);
    } catch (e: unknown) {
      console.error("Chat error:", e);
      const errMsg = (e instanceof Error ? e.message : null) || "Erreur inconnue";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, status: "failed" as MessageStatus, error: errMsg }
            : m
        )
      );
      toast.error("L'assistant n'a pas pu répondre");
    } finally {
      processingRef.current = false;
      if (queueRef.current.length > 0) {
        void processQueue();
      }
    }
  }, [persistConvo]);

  const sendMessage = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        status: "sending",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      queueRef.current.push(userMsg.id);
      // kick off worker on next tick so state updates apply
      setTimeout(() => void processQueue(), 0);
    },
    [processQueue]
  );

  const retryMessage = useCallback(
    (assistantId: string) => {
      // Find the user message just before this failed assistant
      const idx = messagesRef.current.findIndex((m) => m.id === assistantId);
      if (idx <= 0) return;
      let userMsg: ChatMessage | undefined;
      for (let i = idx - 1; i >= 0; i--) {
        if (messagesRef.current[i].role === "user") {
          userMsg = messagesRef.current[i];
          break;
        }
      }
      if (!userMsg) return;
      // Remove the failed assistant message
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      // Re-queue the user message
      queueRef.current.push(userMsg.id);
      setTimeout(() => void processQueue(), 0);
    },
    [processQueue]
  );

  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConvoId(null);
    convoIdRef.current = null;
    queueRef.current = [];
  }, []);

  const loadConversation = useCallback((convo: Conversation) => {
    setMessages(convo.messages);
    setCurrentConvoId(convo.id);
    convoIdRef.current = convo.id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const newHistory = historyRef.current.filter((h) => h.id !== id);
      setHistory(newHistory);
      saveHistory(newHistory);
      if (convoIdRef.current === id) {
        setMessages([]);
        setCurrentConvoId(null);
        convoIdRef.current = null;
      }
    },
    []
  );

  return {
    messages,
    isLoading: isAssistantThinking,
    isAssistantThinking,
    history,
    sendMessage,
    retryMessage,
    newConversation,
    loadConversation,
    deleteConversation,
  };
};
