import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UserEntity } from './entities/user.entity.js';
import { SessionModule } from '../session/session.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), SessionModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}