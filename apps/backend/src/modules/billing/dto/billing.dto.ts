import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class RecordPaymentDto {
  @IsString()
  appointmentId: string;

  @IsNumber()
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  amount: number;

  @IsEnum(PaymentMethod, {
    message: 'Payment method must be CASH, CARD, UPI, or OTHER',
  })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class WaivePaymentDto {
  @IsString()
  appointmentId: string;

  @IsString()
  reason: string;
}

export class GetPaymentsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  doctorId?: string;
}
