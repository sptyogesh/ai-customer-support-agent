import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  type Content,
} from '@google/generative-ai';
import { Sender } from '@prisma/client';

export const SYSTEM_PROMPT = `You are a helpful customer support agent for a fictional ecommerce store.

Store Information:

Shipping:
- Free shipping on orders above $50
- Delivery takes 3–5 business days

Returns:
- Returns accepted within 30 days of delivery
- Product must be unused

Refunds:
- Refund processed within 5 business days

Support Hours:
- Monday to Friday
- 9 AM to 6 PM

Answer clearly, professionally, and concisely.`;

export const FALLBACK_REPLY =
  "Sorry, I'm having trouble responding right now. Please try again later.";

export interface ChatHistoryMessage {
  sender: Sender;
  text: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI | null;
  private readonly model: string;
  private readonly timeoutMs = 30_000;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async generateReply(
    history: ChatHistoryMessage[],
    userMessage: string,
  ): Promise<string> {
    if (!this.client) {
      this.logger.error('Gemini API key is not configured');
      return FALLBACK_REPLY;
    }

    const generativeModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const chatHistory: Content[] = history.map((msg) => ({
      role: msg.sender === Sender.USER ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    try {
      const chat = generativeModel.startChat({ history: chatHistory });

      const result = await Promise.race([
        chat.sendMessage(userMessage),
        this.timeout(this.timeoutMs),
      ]);

      const reply = result.response.text()?.trim();
      if (!reply) {
        this.logger.warn('Gemini returned an empty response');
        return FALLBACK_REPLY;
      }

      return reply;
    } catch (error) {
      this.logGeminiError(error);
      return FALLBACK_REPLY;
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    });
  }

  private logGeminiError(error: unknown): void {
    if (error instanceof Error) {
      const message = error.message;

      if (
        message.includes('API key') ||
        message.includes('API_KEY_INVALID') ||
        message.includes('403')
      ) {
        this.logger.error('Invalid Gemini API key');
        return;
      }
      if (message.includes('429') || message.includes('quota')) {
        this.logger.error(
          `Gemini quota/rate limit exceeded for model "${this.model}": ${message.split('\n')[0]}`,
        );
        return;
      }
      if (message.includes('timeout') || error.name === 'AbortError') {
        this.logger.error('Gemini request timed out');
        return;
      }
      if (
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('network') ||
        message.includes('fetch failed')
      ) {
        this.logger.error('Network failure while contacting Gemini');
        return;
      }

      this.logger.error(`Gemini API error: ${error.message}`, error.stack);
      return;
    }

    this.logger.error('Unknown error while contacting Gemini');
  }
}
