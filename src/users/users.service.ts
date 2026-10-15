import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { SessionService } from '../session/session.service.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly sessionService: SessionService,
  ) {}

  async register(dto: RegisterUserDto): Promise<void> {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException();
    }

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

  async login(dto: LoginUserDto): Promise<string> {
    const user = await this.userRepo.findOne({ where: { username: dto.username, password: dto.password } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const sessionId = uuidv4();
    await this.sessionService.create(sessionId, user.user_id);
    return sessionId;
  }

  async logout(sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.sessionService.destroy(sessionId);
    }
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { user_id: id } });
  }
}