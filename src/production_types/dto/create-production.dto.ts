import { IsString, IsOptional } from 'class-validator';

export class CreateProductionDto {
  @IsString()
  craft_title: string;

  @IsOptional()
  @IsString()
  description?: string;
}