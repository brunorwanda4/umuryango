import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthAuditAction, UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { hash as bcryptHash } from 'bcryptjs';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { GoogleUser } from './strategies/google.strategy';

const googleUser: GoogleUser = {
  googleId: 'g-123',
  email: 'New.User@Example.com',
  fullName: 'New User',
  avatarUrl: 'https://img/avatar.png',
};

const baseUser = {
  id: 'u-1',
  email: 'new.user@example.com',
  phoneNumber: null,
  fullName: 'New User',
  passwordHash: null,
  googleId: 'g-123',
  avatarUrl: 'https://img/avatar.png',
  status: UserStatus.ACTIVE,
  emailVerifiedAt: new Date(),
};

describe('LoginDto', () => {
  it('normalizes identifiers copied from quoted seed values', () => {
    const dto = plainToInstance(LoginDto, {
      emailOrMobile: " 'aline.mukamana@example.com' ",
      password: 'RwandaFamily123!',
    });

    expect(dto.emailOrMobile).toBe('aline.mukamana@example.com');
    expect(dto.password).toBe('RwandaFamily123!');
  });
});

describe('AuthService Google login', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
    };
    authSession: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findFirst: jest.Mock;
    };
    authAuditEvent: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      authSession: {
        create: jest.fn().mockResolvedValue({ id: 's-1' }),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
      },
      authAuditEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
      verifyAsync: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('30') },
        },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('creates a new user when no googleId and no email match', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null); // by googleId
    prisma.user.findUnique.mockResolvedValueOnce(null); // by email
    prisma.user.create.mockResolvedValue(baseUser);

    const result = await service.loginWithGoogle(googleUser, {});

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new.user@example.com',
          googleId: 'g-123',
          status: UserStatus.ACTIVE,
          emailVerifiedAt: expect.any(Date),
        }),
      }),
    );
    expect(result.accessToken).toBe('access-token');
  });

  it('links Google to an existing email/password user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null); // by googleId
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      googleId: null,
      passwordHash: 'hash',
      emailVerifiedAt: null,
    }); // by email
    prisma.user.update.mockResolvedValue(baseUser);

    await service.loginWithGoogle(googleUser, {});

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-1' },
        data: expect.objectContaining({
          googleId: 'g-123',
          emailVerifiedAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('logs in directly when googleId already exists', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(baseUser); // by googleId

    await service.loginWithGoogle(googleUser, {});

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects password login for a Google-only account (null passwordHash)', async () => {
    prisma.user.findFirst.mockResolvedValue({
      ...baseUser,
      passwordHash: null,
    });

    await expect(
      service.login(
        { emailOrMobile: 'new.user@example.com', password: 'x' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh tokens for an active session', async () => {
    const refreshToken = 'refresh-token';
    const refreshTokenHash = await bcryptHash(refreshToken, 12);
    prisma.authSession.findMany.mockResolvedValue([
      {
        id: 's-1',
        userId: 'u-1',
        refreshTokenHash,
        user: baseUser,
      },
    ]);
    prisma.authSession.update.mockResolvedValue({});

    const result = await service.refreshSession(refreshToken, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(prisma.authSession.update).toHaveBeenCalledWith({
      where: { id: 's-1' },
      data: expect.objectContaining({
        refreshTokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    });
    expect(prisma.authAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AuthAuditAction.REFRESH_TOKEN,
        userId: 'u-1',
      }),
    });
  });

  it('revokes by refresh token when the access token is unavailable', async () => {
    const refreshToken = 'refresh-token';
    const refreshTokenHash = await bcryptHash(refreshToken, 12);
    prisma.authSession.findMany.mockResolvedValue([
      {
        id: 's-1',
        userId: 'u-1',
        refreshTokenHash,
        user: baseUser,
      },
    ]);

    await service.logout(undefined, refreshToken);

    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 's-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
