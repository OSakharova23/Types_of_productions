import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionTypesController } from './production_types.controller.js';
import { ProductionTypesService } from './production_types.service.js';
import { MinioSimpleService } from './minio.service.js';
import { ProductionTypeEntity } from './entities/production_types.entity.js';
import { LikeEntity } from './entities/like.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionTypeEntity, LikeEntity, UserEntity])],
  controllers: [ProductionTypesController],
  providers: [ProductionTypesService, MinioSimpleService],
})
export class ProductionTypesModule {}