import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService, type LoginResult } from './auth.service';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Create a user account and send an email verification code',
  })
  @ApiCreatedResponse({
    description: 'Account created and verification code sent.',
    schema: {
      example: {
        data: {
          email: 'claudine@example.com',
          fullName: 'Claudine Uwase',
          requiresEmailVerification: true,
          verificationCodeExpiresInMinutes: 10,
        },
        message: 'Account created. Check your email for the verification code.',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email or phone number is already registered.',
  })
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    const result = await this.authService.register(registerDto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    return {
      data: result,
      message: 'Account created. Check your email for the verification code.',
    };
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify an email address and start an authenticated session',
  })
  @ApiOkResponse({
    description: 'Email verified and auth cookies set.',
    schema: {
      example: {
        data: {
          user: {
            id: 'clx0000000000000000000000',
            email: 'claudine@example.com',
            phoneNumber: '+250788123456',
            fullName: 'Claudine Uwase',
          },
          accessTokenExpiresInSeconds: 900,
          refreshTokenExpiresAt: '2026-07-16T07:00:00.000Z',
        },
        message: 'Email verified successfully.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Verification code is invalid, expired, or already exhausted.',
  })
  @ApiConflictResponse({
    description: 'Email is already verified.',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const loginResult = await this.authService.verifyEmail(verifyEmailDto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    this.setAuthCookies(response, loginResult);

    return {
      data: {
        user: loginResult.user,
        accessTokenExpiresInSeconds: loginResult.accessTokenExpiresInSeconds,
        refreshTokenExpiresAt: loginResult.refreshTokenExpiresAt,
      },
      message: 'Email verified successfully.',
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new email verification code when needed' })
  @ApiOkResponse({
    description: 'Verification resend request accepted.',
    schema: {
      example: {
        data: {
          requiresEmailVerification: true,
        },
        message: 'If the account needs verification, a new code has been sent.',
      },
    },
  })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    const result = await this.authService.resendVerification(resendDto);

    return {
      data: result,
      message: 'If the account needs verification, a new code has been sent.',
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and set secure auth cookies' })
  @ApiOkResponse({
    description: 'Login succeeded and auth cookies set.',
    schema: {
      example: {
        data: {
          user: {
            id: 'clx0000000000000000000000',
            email: 'claudine@example.com',
            phoneNumber: '+250788123456',
            fullName: 'Claudine Uwase',
          },
          accessTokenExpiresInSeconds: 900,
          refreshTokenExpiresAt: '2026-07-16T07:00:00.000Z',
        },
        message: 'Logged in successfully.',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credentials are invalid or the email must be verified first.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const loginResult = await this.authService.login(loginDto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    this.setAuthCookies(response, loginResult);

    return {
      data: {
        user: loginResult.user,
        accessTokenExpiresInSeconds: loginResult.accessTokenExpiresInSeconds,
        refreshTokenExpiresAt: loginResult.refreshTokenExpiresAt,
      },
      message: 'Logged in successfully.',
    };
  }

  private setAuthCookies(response: Response, loginResult: LoginResult) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };

    if (!loginResult.accessToken || !loginResult.refreshToken) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    response.cookie(ACCESS_COOKIE_NAME, loginResult.accessToken, {
      ...cookieOptions,
      maxAge: loginResult.accessTokenExpiresInSeconds * 1000,
    });
    response.cookie(REFRESH_COOKIE_NAME, loginResult.refreshToken, {
      ...cookieOptions,
      expires: loginResult.refreshTokenExpiresAt,
    });
  }
}
