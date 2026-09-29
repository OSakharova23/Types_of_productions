import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductionDto {
  @IsOptional()
  @IsString()
  craft_title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  production_output_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defect_waste_quantity?: number;
}