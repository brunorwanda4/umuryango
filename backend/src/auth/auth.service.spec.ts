import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
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
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
    };
    authSession: { create: jest.Mock };
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
      authSession: { create: jest.fn().mockResolvedValue({ id: 's-1' }) },
      authAuditEvent: { create: jest.fn().mockResolvedValue({}) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('access-token') },
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
});
