import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity.js';
import { RegisterUserDto } from './dto/register-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async register(dto: RegisterUserDto): Promise<void> {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException(); // Пустое исключение без текстовых сообщений
    }

    // Генерация ID для нового пользователя (или автоинкремент в БД)
    const maxRes = await this.userRepo
      .createQueryBuilder('u')
      .select('MAX(u.user_id)', 'max')
      .getRawOne();
    const newId = (Number(maxRes?.max) || 0) + 1;

    const newUser = this.userRepo.create({
      user_id: newId,
      username: dto.username,
      password: dto.password,
    });

    await this.userRepo.save(newUser);
  }
}