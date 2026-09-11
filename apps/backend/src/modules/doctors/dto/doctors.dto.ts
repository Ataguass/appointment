import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MinLength,
  Min,
  Max,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  email: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  specialization: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsNumber()
  @Min(0)
  consultationFee: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  slotDurationMins?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  slotDurationMins?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignDepartmentsDto {
  @IsArray()
  @IsString({ each: true })
  departmentIds: string[];
}
