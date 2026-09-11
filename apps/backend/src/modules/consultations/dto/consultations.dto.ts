import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SaveConsultationDto {
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  prescription?: string; // JSON string or text containing medication list

  @IsOptional()
  @IsBoolean()
  completeAppointment?: boolean; // Default true
}
