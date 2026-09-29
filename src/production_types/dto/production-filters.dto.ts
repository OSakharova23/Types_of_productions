import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductionFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_rate?: number;
}