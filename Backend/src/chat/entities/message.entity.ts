import { Sender } from '@prisma/client';

export class MessageEntity {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: Date;
}
