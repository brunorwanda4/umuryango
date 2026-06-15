import { randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { AuthAuditAction, AuthAuditResult, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

  async register(
    registerDto: RegisterDto,
    context: RequestContext,
  ): Promise<LoginResult> {
    const email = registerDto.email.toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(registerDto.phoneNumber ? [{ phoneNumber: registerDto.phoneNumber }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email is already registered.');
      }
      throw new ConflictException('Phone number is already registered.');
    }

    const passwordHash = await hash(registerDto.password, 12);
    const fullName = `${registerDto.firstName} ${registerDto.lastName}`.trim();

    const user = await this.prisma.user.create({
      data: {
        email,
        phoneNumber: registerDto.phoneNumber || null,
        fullName,
        gender: registerDto.gender || null,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    await this.writeLoginAudit({
      emailOrMobile: email,
      result: AuthAuditResult.SUCCESS,
      context,
      userId: user.id,
      action: AuthAuditAction.REGISTER,
    });

    return this.createSessionAndTokens(user, context);
  }

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

    await this.writeLoginAudit({
      emailOrMobile: loginDto.emailOrMobile,
      result: AuthAuditResult.SUCCESS,
      context,
      userId: user.id,
    });

    return this.createSessionAndTokens(user, context);
  }

  private async createSessionAndTokens(
    user: { id: string; email: string; phoneNumber: string | null; fullName: string },
    context: RequestContext,
  ): Promise<LoginResult> {
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
    action = AuthAuditAction.LOGIN,
  }: {
    emailOrMobile: string;
    result: AuthAuditResult;
    context: RequestContext;
    userId?: string;
    action?: AuthAuditAction;
  }) {
    await this.prisma.authAuditEvent.create({
      data: {
        action,
        result,
        emailOrMobile,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId,
      },
    });
  }
}
