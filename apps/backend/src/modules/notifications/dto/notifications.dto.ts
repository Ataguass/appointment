import { IsString, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  recipientId: string;

  @IsString()
  type: string; // CONFIRMATION, REMINDER, CANCELLATION, RESCHEDULE, QUEUE_UPDATE

  @IsString()
  channel: string; // EMAIL, PUSH, SMS

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;
}
