import { useCallback, useEffect, useState } from 'react';
import { ChatWindow } from '../components/ChatWindow';
import {
  fetchChatHistory,
  sendChatMessage,
  type ChatMessage,
} from '../services/chatApi';

const SESSION_KEY = 'chatSessionId';

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function ChatPage() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const history = await fetchChatHistory(sessionId);
        if (!cancelled) {
          setMessages(history);
        }
      } catch {
        // New session — no history yet
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleSend = useCallback(
    async (text: string) => {
      const optimisticUserMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        conversationId: sessionId,
        sender: 'USER',
        text,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setIsTyping(true);

      try {
        const { reply } = await sendChatMessage(text, sessionId);

        const aiMessage: ChatMessage = {
          id: `temp-ai-${Date.now()}`,
          conversationId: sessionId,
          sender: 'AI',
          text: reply,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Refresh to get server-assigned IDs and timestamps
        const history = await fetchChatHistory(sessionId);
        setMessages(history);
      } catch {
        const errorMessage: ChatMessage = {
          id: `temp-error-${Date.now()}`,
          conversationId: sessionId,
          sender: 'AI',
          text: "Sorry, I'm having trouble responding right now. Please try again later.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-indigo-50 p-4">
      <div className="h-[min(700px,90vh)] w-full max-w-lg">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          isTyping={isTyping}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
