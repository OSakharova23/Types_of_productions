import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionTypesController } from './production_types.controller.js';
import { ProductionTypesService } from './production_types.service.js';
import { ProductionTypeEntity } from './entities/production_types.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { LikeEntity } from './entities/like.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionTypeEntity, UserEntity, LikeEntity])],
  controllers: [ProductionTypesController],
  providers: [ProductionTypesService],
})
export class ProductionTypesModule {}