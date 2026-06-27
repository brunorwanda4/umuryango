import { randomBytes, randomInt } from "node:crypto";
import {
	BadRequestException,
	ConflictException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthAuditAction, AuthAuditResult, UserStatus } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { ResendVerificationDto } from "./dto/resend-verification.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { VerifyEmailDto } from "./dto/verify-email.dto";

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

export type RegisterResult = {
	email: string;
	fullName: string;
	requiresEmailVerification: true;
	verificationCodeExpiresInMinutes: number;
};

@Injectable()
export class AuthService {
	private readonly accessTokenExpiresInSeconds = 15 * 60;
	private readonly verificationCodeExpiresInMinutes = 10;
	private readonly passwordResetCodeExpiresInMinutes = 10;
	private readonly maxVerificationAttempts = 5;
	private readonly maxResetAttempts = 5;

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly mailService: MailService,
	) {}

	async register(
		registerDto: RegisterDto,
		context: RequestContext,
	): Promise<RegisterResult> {
		const email = registerDto.email.toLowerCase();
		const existingUser = await this.prisma.user.findFirst({
			where: {
				OR: [
					{ email },
					...(registerDto.phoneNumber
						? [{ phoneNumber: registerDto.phoneNumber }]
						: []),
				],
			},
		});

		if (existingUser) {
			if (existingUser.email === email) {
				throw new ConflictException("Email is already registered.");
			}
			throw new ConflictException("Phone number is already registered.");
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

		await this.issueVerificationCode(user);

		return {
			email: user.email,
			fullName: user.fullName,
			requiresEmailVerification: true,
			verificationCodeExpiresInMinutes: this.verificationCodeExpiresInMinutes,
		};
	}

	async verifyEmail(
		verifyEmailDto: VerifyEmailDto,
		context: RequestContext,
	): Promise<LoginResult> {
		const email = verifyEmailDto.email.toLowerCase();
		const user = await this.prisma.user.findUnique({ where: { email } });

		if (!user || user.status !== UserStatus.ACTIVE) {
			throw new BadRequestException("Invalid verification request.");
		}

		if (user.emailVerifiedAt) {
			throw new ConflictException("Email is already verified.");
		}

		const verification = await this.prisma.emailVerification.findFirst({
			where: { userId: user.id, consumedAt: null },
			orderBy: { createdAt: "desc" },
		});

		if (!verification || verification.expiresAt.getTime() < Date.now()) {
			throw new BadRequestException(
				"Verification code is invalid or has expired.",
			);
		}

		if (verification.attempts >= this.maxVerificationAttempts) {
			await this.prisma.emailVerification.update({
				where: { id: verification.id },
				data: { consumedAt: new Date() },
			});
			throw new BadRequestException(
				"Too many attempts. Please request a new verification code.",
			);
		}

		const codeMatches = await compare(
			verifyEmailDto.code,
			verification.codeHash,
		);

		if (!codeMatches) {
			await this.prisma.emailVerification.update({
				where: { id: verification.id },
				data: { attempts: { increment: 1 } },
			});
			await this.writeLoginAudit({
				emailOrMobile: email,
				result: AuthAuditResult.FAILURE,
				context,
				userId: user.id,
				action: AuthAuditAction.EMAIL_VERIFICATION,
			});
			throw new BadRequestException("Verification code is incorrect.");
		}

		const verifiedUser = await this.prisma.$transaction(async (tx) => {
			await tx.emailVerification.update({
				where: { id: verification.id },
				data: { consumedAt: new Date() },
			});
			return tx.user.update({
				where: { id: user.id },
				data: { emailVerifiedAt: new Date() },
			});
		});

		await this.writeLoginAudit({
			emailOrMobile: email,
			result: AuthAuditResult.SUCCESS,
			context,
			userId: user.id,
			action: AuthAuditAction.EMAIL_VERIFICATION,
		});

		return this.createSessionAndTokens(verifiedUser, context);
	}

	async resendVerification(
		resendDto: ResendVerificationDto,
	): Promise<{ requiresEmailVerification: boolean }> {
		const email = resendDto.email.toLowerCase();
		const user = await this.prisma.user.findUnique({ where: { email } });

		// Do not reveal whether the account exists.
		if (user && user.status === UserStatus.ACTIVE && !user.emailVerifiedAt) {
			await this.issueVerificationCode(user);
		}

		return { requiresEmailVerification: true };
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

		if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
			await this.writeLoginAudit({
				emailOrMobile: loginDto.emailOrMobile,
				result: AuthAuditResult.FAILURE,
				context,
				userId: user?.id,
			});
			throw new UnauthorizedException("Invalid login credentials.");
		}

		const passwordMatches = await compare(loginDto.password, user.passwordHash);

		if (!passwordMatches) {
			await this.writeLoginAudit({
				emailOrMobile: loginDto.emailOrMobile,
				result: AuthAuditResult.FAILURE,
				context,
				userId: user.id,
			});
			throw new UnauthorizedException("Invalid login credentials.");
		}

		if (!user.emailVerifiedAt) {
			await this.issueVerificationCode(user);
			await this.writeLoginAudit({
				emailOrMobile: loginDto.emailOrMobile,
				result: AuthAuditResult.FAILURE,
				context,
				userId: user.id,
			});
			throw new UnauthorizedException(
				"Please verify your email. We sent you a new verification code.",
			);
		}

		await this.writeLoginAudit({
			emailOrMobile: loginDto.emailOrMobile,
			result: AuthAuditResult.SUCCESS,
			context,
			userId: user.id,
		});

		return this.createSessionAndTokens(user, context);
	}

	// ─── Forgot Password ────────────────────────────────────────────────────────

	async forgotPassword(
		forgotPasswordDto: ForgotPasswordDto,
		context: RequestContext,
	): Promise<void> {
		const email = forgotPasswordDto.email.toLowerCase();
		const user = await this.prisma.user.findUnique({ where: { email } });

		// Always succeed to avoid user enumeration.
		if (user && user.status === UserStatus.ACTIVE) {
			await this.issuePasswordResetCode(user);
			await this.writeLoginAudit({
				emailOrMobile: email,
				result: AuthAuditResult.SUCCESS,
				context,
				userId: user.id,
				action: AuthAuditAction.PASSWORD_RESET,
			});
		}
	}

	async resetPassword(
		resetPasswordDto: ResetPasswordDto,
		context: RequestContext,
	): Promise<void> {
		const email = resetPasswordDto.email.toLowerCase();
		const user = await this.prisma.user.findUnique({ where: { email } });

		if (!user || user.status !== UserStatus.ACTIVE) {
			throw new BadRequestException("Invalid password reset request.");
		}

		const resetRecord = await this.prisma.passwordReset.findFirst({
			where: { userId: user.id, consumedAt: null },
			orderBy: { createdAt: "desc" },
		});

		if (!resetRecord || resetRecord.expiresAt.getTime() < Date.now()) {
			throw new BadRequestException(
				"Reset code is invalid or has expired.",
			);
		}

		if (resetRecord.attempts >= this.maxResetAttempts) {
			await this.prisma.passwordReset.update({
				where: { id: resetRecord.id },
				data: { consumedAt: new Date() },
			});
			throw new BadRequestException(
				"Too many attempts. Please request a new reset code.",
			);
		}

		const codeMatches = await compare(
			resetPasswordDto.code,
			resetRecord.codeHash,
		);

		if (!codeMatches) {
			await this.prisma.passwordReset.update({
				where: { id: resetRecord.id },
				data: { attempts: { increment: 1 } },
			});
			await this.writeLoginAudit({
				emailOrMobile: email,
				result: AuthAuditResult.FAILURE,
				context,
				userId: user.id,
				action: AuthAuditAction.PASSWORD_RESET,
			});
			throw new BadRequestException("Reset code is incorrect.");
		}

		const newPasswordHash = await hash(resetPasswordDto.newPassword, 12);

		await this.prisma.$transaction([
			this.prisma.passwordReset.update({
				where: { id: resetRecord.id },
				data: { consumedAt: new Date() },
			}),
			this.prisma.user.update({
				where: { id: user.id },
				data: { passwordHash: newPasswordHash },
			}),
			// Revoke all active sessions so old tokens can no longer be used.
			this.prisma.authSession.updateMany({
				where: { userId: user.id, revokedAt: null },
				data: { revokedAt: new Date() },
			}),
		]);

		await this.writeLoginAudit({
			emailOrMobile: email,
			result: AuthAuditResult.SUCCESS,
			context,
			userId: user.id,
			action: AuthAuditAction.PASSWORD_RESET,
		});
	}

	// ─── Private helpers ────────────────────────────────────────────────────────

	private async issueVerificationCode(user: {
		id: string;
		email: string;
		fullName: string;
	}): Promise<void> {
		const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
		const codeHash = await hash(code, 10);
		const expiresAt = new Date(
			Date.now() + this.verificationCodeExpiresInMinutes * 60 * 1000,
		);

		await this.prisma.$transaction([
			this.prisma.emailVerification.updateMany({
				where: { userId: user.id, consumedAt: null },
				data: { consumedAt: new Date() },
			}),
			this.prisma.emailVerification.create({
				data: {
					userId: user.id,
					codeHash,
					expiresAt,
				},
			}),
		]);

		await this.mailService.sendVerificationCode({
			to: user.email,
			fullName: user.fullName,
			code,
			expiresInMinutes: this.verificationCodeExpiresInMinutes,
		});
	}

	private async issuePasswordResetCode(user: {
		id: string;
		email: string;
		fullName: string;
	}): Promise<void> {
		const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
		const codeHash = await hash(code, 10);
		const expiresAt = new Date(
			Date.now() + this.passwordResetCodeExpiresInMinutes * 60 * 1000,
		);

		await this.prisma.$transaction([
			// Invalidate any existing pending reset codes.
			this.prisma.passwordReset.updateMany({
				where: { userId: user.id, consumedAt: null },
				data: { consumedAt: new Date() },
			}),
			this.prisma.passwordReset.create({
				data: {
					userId: user.id,
					codeHash,
					expiresAt,
				},
			}),
		]);

		await this.mailService.sendPasswordResetCode({
			to: user.email,
			fullName: user.fullName,
			code,
			expiresInMinutes: this.passwordResetCodeExpiresInMinutes,
		});
	}

	private async createSessionAndTokens(
		user: {
			id: string;
			email: string;
			phoneNumber: string | null;
			fullName: string;
		},
		context: RequestContext,
	): Promise<LoginResult> {
		const refreshToken = randomBytes(64).toString("base64url");
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
			type: "access",
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
			this.configService.get<string>("JWT_REFRESH_EXPIRES_IN_DAYS", "30"),
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
