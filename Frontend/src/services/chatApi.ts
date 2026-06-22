const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export type Sender = 'USER' | 'AI';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
    }));
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function fetchChatHistory(
  sessionId: string,
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/chat/history?sessionId=${encodeURIComponent(sessionId)}`,
  );
  return handleResponse<ChatMessage[]>(response);
}

export async function sendChatMessage(
  message: string,
  sessionId: string,
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });
  return handleResponse<SendMessageResponse>(response);
}
