import { IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class LikeDto {
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 1]) // 0 отменяет лайк, 1 ставит лайк
  action: number;
}