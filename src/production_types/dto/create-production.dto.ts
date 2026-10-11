import { IsString } from 'class-validator';

export class CreateProductionDto {
  @IsString()
  craft_title: string;
}