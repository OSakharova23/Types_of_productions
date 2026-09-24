import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity.js';

@Entity('production_types')
export class ProductionTypeEntity {
  @PrimaryColumn()
  production_id: number;

  @Column({ type: 'varchar', length: 150 })
  craft_title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  // URL обязательные
  @Column({ type: 'varchar' })
  image_key: string;

  @Column({ type: 'varchar' })
  video_key: string;

  // Поля по теме nullable
  @Column({ type: 'int', nullable: true })
  production_output_rate: number | null;

  @Column({ type: 'int', nullable: true })
  defect_waste_quantity: number | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  formed_at: Date | null;

  @Column({ type: 'int', default: 1 })
  creator_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;
}