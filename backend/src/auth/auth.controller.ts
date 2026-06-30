import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService, type LoginResult } from './auth.service';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from './auth.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import type { GoogleUser } from './strategies/google.strategy';

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

  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiOkResponse({
    description: 'Authenticated user retrieved.',
    schema: {
      example: {
        data: {
          user: {
            id: 'clx0000000000000000000000',
            email: 'claudine@example.com',
            phoneNumber: '+250788123456',
            fullName: 'Claudine Uwase',
            avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.png',
          },
        },
        message: 'Authenticated user retrieved.',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No valid session was found.',
  })
  async me(@Req() request: Request) {
    const accessToken = request.cookies?.[ACCESS_COOKIE_NAME] as
      | string
      | undefined;
    const user = await this.authService.getCurrentUser(accessToken);

    return {
      data: { user },
      message: 'Authenticated user retrieved.',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current session and clear auth cookies' })
  @ApiOkResponse({
    description: 'Logged out and auth cookies cleared.',
    schema: {
      example: {
        data: {},
        message: 'Logged out successfully.',
      },
    },
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = request.cookies?.[ACCESS_COOKIE_NAME] as
      | string
      | undefined;
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    await this.authService.logout(accessToken, refreshToken);
    this.clearAuthCookies(response);

    return {
      data: {},
      message: 'Logged out successfully.',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh the current authenticated session' })
  @ApiOkResponse({
    description: 'Session refreshed and auth cookies rotated.',
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
          refreshTokenExpiresAt: '2026-07-30T07:00:00.000Z',
        },
        message: 'Session refreshed successfully.',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No valid refresh session was found.',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    const loginResult = await this.authService.refreshSession(refreshToken, {
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
      message: 'Session refreshed successfully.',
    };
  }

  @Get('google')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // The AuthGuard redirects the browser to Google's consent screen.
  }

  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const googleUser = request.user as GoogleUser;

    const loginResult = await this.authService.loginWithGoogle(googleUser, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    this.setAuthCookies(response, loginResult);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4914';
    response.redirect(`${frontendUrl}/me`);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Request a password reset code. Always succeeds to prevent user enumeration.',
  })
  @ApiOkResponse({
    description: 'Reset code sent if the account exists.',
    schema: {
      example: {
        data: {},
        message:
          'If that email is registered, a reset code has been sent. Check your inbox.',
      },
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    await this.authService.forgotPassword(forgotPasswordDto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    return {
      data: {},
      message:
        'If that email is registered, a reset code has been sent. Check your inbox.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the reset code and set a new password' })
  @ApiOkResponse({
    description: 'Password updated and all active sessions revoked.',
    schema: {
      example: {
        data: {},
        message: 'Password updated successfully. Please log in again.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Reset code is invalid, expired, or too many attempts.',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() request: Request,
  ) {
    await this.authService.resetPassword(resetPasswordDto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    return {
      data: {},
      message: 'Password updated successfully. Please log in again.',
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

  private clearAuthCookies(response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };

    response.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);
    response.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
  }
}
