import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterUserDto) {
    await this.usersService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login() {
    return;
  }

  @Post('logout')
  @HttpCode(204)
  async logout() {
    return;
  }
}