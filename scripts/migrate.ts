import { DataSource } from 'typeorm';
import { UserEntity } from '../src/production_types/entities/user.entity.js';
import { ProductionTypeEntity } from '../src/production_types/entities/production_types.entity.js';
import { LikeEntity } from '../src/production_types/entities/like.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5455,
  username: 'myuser',
  password: 'mypassword',
  database: 'production_types_db',
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