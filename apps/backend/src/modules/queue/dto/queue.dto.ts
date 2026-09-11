import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CallNextTokenDto {
  @IsString()
  doctorId: string;
}

export class AnnounceDelayDto {
  @IsString()
  doctorId: string;

  @IsNumber()
  @Min(1, { message: 'Delay must be at least 1 minute' })
  delayMinutes: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
