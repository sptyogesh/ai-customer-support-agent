import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { MessageEntity } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<ChatResponseDto> {
    const conversation = await this.findOrCreateConversation(dto.sessionId);

    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        text: dto.message,
      },
    });

    const reply = await this.gemini.generateReply(history, dto.message);

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'AI',
        text: reply,
      },
    });

    return {
      reply,
      sessionId: conversation.id,
    };
  }

  async getHistory(sessionId: string): Promise<MessageEntity[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: sessionId },
    });

    if (!conversation) {
      return [];
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId: sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  private async findOrCreateConversation(sessionId: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { id: sessionId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: { id: sessionId },
    });
  }
}
