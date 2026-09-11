import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class DayScheduleDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm 24-hour format (e.g. 09:00)',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm 24-hour format (e.g. 17:00)',
  })
  endTime: string;

  @IsBoolean()
  isActive: boolean;
}

export class SetScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedules: DayScheduleDto[];
}

export class BreakItemDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm 24-hour format (e.g. 13:00)',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm 24-hour format (e.g. 14:00)',
  })
  endTime: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class SetBreaksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakItemDto)
  breaks: BreakItemDto[];
}

export class CreateLeaveDto {
  @IsDateString()
  startDate: string; // YYYY-MM-DD

  @IsDateString()
  endDate: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateHolidayDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GenerateSlotsDto {
  @IsString()
  doctorId: string;

  @IsDateString()
  startDate: string; // YYYY-MM-DD

  @IsDateString()
  endDate: string; // YYYY-MM-DD
}
