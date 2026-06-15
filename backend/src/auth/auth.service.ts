import { randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { AuthAuditAction, AuthAuditResult, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  phoneNumber: string | null;
  fullName: string;
};

export type LoginResult = {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresAt: Date;
};

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresInSeconds = 15 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    loginDto: LoginDto,
    context: RequestContext,
  ): Promise<LoginResult> {
    const emailOrMobile = loginDto.emailOrMobile.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrMobile }, { phoneNumber: loginDto.emailOrMobile }],
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.writeLoginAudit({
        emailOrMobile: loginDto.emailOrMobile,
        result: AuthAuditResult.FAILURE,
        context,
        userId: user?.id,
      });
      throw new UnauthorizedException('Invalid login credentials.');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      await this.writeLoginAudit({
        emailOrMobile: loginDto.emailOrMobile,
        result: AuthAuditResult.FAILURE,
        context,
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid login credentials.');
    }

    const refreshToken = randomBytes(64).toString('base64url');
    const refreshTokenHash = await hash(refreshToken, 12);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      sessionId: session.id,
      type: 'access',
    });

    await this.writeLoginAudit({
      emailOrMobile: loginDto.emailOrMobile,
      result: AuthAuditResult.SUCCESS,
      context,
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: this.accessTokenExpiresInSeconds,
      refreshTokenExpiresAt,
    };
  }

  private getRefreshTokenExpiresAt() {
    const days = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS', '30'),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private async writeLoginAudit({
    emailOrMobile,
    result,
    context,
    userId,
  }: {
    emailOrMobile: string;
    result: AuthAuditResult;
    context: RequestContext;
    userId?: string;
  }) {
    await this.prisma.authAuditEvent.create({
      data: {
        action: AuthAuditAction.LOGIN,
        result,
        emailOrMobile,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId,
      },
    });
  }
}
