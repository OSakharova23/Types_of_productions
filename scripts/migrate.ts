import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { UserEntity } from '../src/users/entities/user.entity.js';
import { ProductionTypeEntity } from '../src/production_types/entities/production_types.entity.js';
import { LikeEntity } from '../src/production_types/entities/like.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5455', 10),
  username: process.env.DB_USERNAME || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_DATABASE || 'production_types_db',
  entities: [UserEntity, ProductionTypeEntity, LikeEntity],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  await dataSource.synchronize();
  console.log('Таблицы успешно созданы в БД.');
  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграции:', err);
  process.exit(1);
});