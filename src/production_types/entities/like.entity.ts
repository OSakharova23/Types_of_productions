import { Entity, PrimaryColumn } from 'typeorm';

@Entity('likes')
export class LikeEntity {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  production_id: number;
}