import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../../session/session.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException();
    }

    const userId = await this.sessionService.getUserId(sessionId);
    if (!userId) {
      throw new UnauthorizedException();
    }

    // Сохраняем пользователя в запрос для дальнейшего использования
    request.user = { id: userId };
    return true;
  }
}