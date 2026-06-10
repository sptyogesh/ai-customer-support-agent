import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  message: string;

  @IsString()
  @IsUUID('4', { message: 'sessionId must be a valid UUID' })
  sessionId: string;
}
