import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  MinLength,
  IsNumber,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class BookAppointmentDto {
  @IsString()
  doctorId: string;

  @IsDateString()
  startTime: string; // ISO 8601 string

  @IsDateString()
  endTime: string; // ISO 8601 string

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  patientId?: string; // Optional: used by staff booking on behalf of patient
}

export class RescheduleAppointmentDto {
  @IsDateString()
  newStartTime: string; // ISO 8601 string

  @IsDateString()
  newEndTime: string; // ISO 8601 string

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelAppointmentDto {
  @IsString()
  @MinLength(3, { message: 'Please provide a cancellation reason (min 3 characters)' })
  reason: string;
}

export class WalkInAppointmentDto {
  @IsString()
  doctorId: string;

  @IsString()
  @MinLength(2, { message: 'Patient name is required' })
  patientName: string;

  @IsString()
  @MinLength(10, { message: 'Valid phone number is required' })
  patientPhone: string;

  @IsOptional()
  @IsString()
  patientEmail?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  status: AppointmentStatus;
}
