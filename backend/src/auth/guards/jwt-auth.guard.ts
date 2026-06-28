import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_COOKIE_NAME } from '../auth.constants';

export type AuthenticatedRequest = Request & { userId: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Not authenticated.');
    }

    let payload: { sub?: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid session.');
    }

    request.userId = payload.sub;
    return true;
  }
}
