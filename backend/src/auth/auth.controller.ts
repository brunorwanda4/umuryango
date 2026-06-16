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
import type { Request, Response } from 'express';
import { AuthService, type LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const ACCESS_COOKIE_NAME = 'rf_access_token';
const REFRESH_COOKIE_NAME = 'rf_refresh_token';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
  ) {
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
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    const result = await this.authService.resendVerification(resendDto);

    return {
      data: result,
      message: 'If the account needs verification, a new code has been sent.',
    };
  }

  @Post('login')
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
