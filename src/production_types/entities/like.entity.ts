import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity.js';
import { ProductionTypeEntity } from './production_types.entity.js';

@Entity('likes')
export class LikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int' })
  production_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => ProductionTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'production_id' })
  production: ProductionTypeEntity;
}