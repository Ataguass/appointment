import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2, { message: 'Department name must be at least 2 characters' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Department name must be at least 2 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
