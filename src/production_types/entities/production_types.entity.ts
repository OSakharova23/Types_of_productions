import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('production_types')
export class ProductionTypeEntity {
  @PrimaryColumn()
  production_id: number;

  @Column({ type: 'varchar', length: 150 })
  craft_title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string; // draft, published, deleted

  @Column({ type: 'varchar', nullable: true })
  image_key: string | null;

  @Column({ type: 'varchar', nullable: true })
  video_key: string | null;

  @Column({ type: 'int' })
  production_output_rate: number;

  @Column({ type: 'int' })
  defect_waste_quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  formed_at: Date | null;

  @Column({ type: 'int', default: 1 })
  creator_id: number;
}