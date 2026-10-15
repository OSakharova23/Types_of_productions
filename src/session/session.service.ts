import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class SessionService {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = parseInt(this.configService.get<string>('REDIS_PORT', '6379'), 10);

    this.redis = new Redis({ host, port });

    this.redis.on('error', (err: Error) => {
      console.error('Redis SessionStore error:', err.message);
    });
  }

  async create(sessionId: string, userId: number, ttlSec: number = 604800): Promise<void> {
    await this.redis.setex(`session:${sessionId}`, ttlSec, String(userId));
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const userIdStr = await this.redis.get(`session:${sessionId}`);
    return userIdStr ? parseInt(userIdStr, 10) : null;
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}