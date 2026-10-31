import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

type VerificationEmailInput = {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
};

type PasswordResetEmailInput = {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
};

type FamilyInviteEmailInput = {
  to: string;
  familyName: string;
  inviterName: string;
  inviteUrl: string;
  expiresInDays: number;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly devMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.devMode =
      this.configService.get<string>('MAIL_DEV_MODE', 'false') === 'true';

    if (this.devMode) {
      // Dev mode: skip SMTP, log codes to the console instead of sending email.
      this.transporter = null;
      this.from = this.configService.get<string>('SMTP_FROM', 'dev@local');
      this.logger.warn(
        'MAIL_DEV_MODE enabled — emails are logged to the console, not sent.',
      );
      return;
    }

    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT', '465'));
    const secure =
      this.configService.get<string>('SMTP_SECURE', 'true') === 'true';
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');

    this.from = this.configService.get<string>('SMTP_FROM', user);

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendVerificationCode({
    to,
    fullName,
    code,
    expiresInMinutes,
  }: VerificationEmailInput): Promise<void> {
    if (this.devMode) {
      this.logger.log(
        `[DEV] Verification code for ${to}: ${code} (expires in ${expiresInMinutes}m)`,
      );
      return;
    }

    const subject = 'Your Umuryango verification code';
    const text = [
      `Hi ${fullName},`,
      '',
      `Your Umuryango verification code is: ${code}`,
      '',
      `This code expires in ${expiresInMinutes} minutes.`,
      'If you did not create this account, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="margin: 0 0 16px;">Hi ${fullName}, use the code below to finish creating your Umuryango account.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 0; text-align: center; background: #f4f4f5; border-radius: 12px;">${code}</div>
        <p style="margin: 16px 0 0; color: #555;">This code expires in ${expiresInMinutes} minutes. If you did not request it, ignore this email.</p>
      </div>`;

    try {
      await this.transporter?.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async sendPasswordResetCode({
    to,
    fullName,
    code,
    expiresInMinutes,
  }: PasswordResetEmailInput): Promise<void> {
    if (this.devMode) {
      this.logger.log(
        `[DEV] Password reset code for ${to}: ${code} (expires in ${expiresInMinutes}m)`,
      );
      return;
    }

    const subject = 'Reset your Umuryango password';
    const text = [
      `Hi ${fullName},`,
      '',
      `Your Umuryango password reset code is: ${code}`,
      '',
      `This code expires in ${expiresInMinutes} minutes.`,
      'If you did not request a password reset, you can safely ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p style="margin: 0 0 16px;">Hi ${fullName}, use the code below to reset your Umuryango account password.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 0; text-align: center; background: #f4f4f5; border-radius: 12px;">${code}</div>
        <p style="margin: 16px 0 0; color: #555;">This code expires in ${expiresInMinutes} minutes. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
      </div>`;

    try {
      await this.transporter?.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async sendFamilyInvite({
    to,
    familyName,
    inviterName,
    inviteUrl,
    expiresInDays,
  }: FamilyInviteEmailInput): Promise<void> {
    if (this.devMode) {
      this.logger.log(
        `[DEV] Family invite for ${to} to "${familyName}": ${inviteUrl} (expires in ${expiresInDays}d)`,
      );
      return;
    }

    const subject = `${inviterName} invited you to the ${familyName} family`;
    const text = [
      'Hi,',
      '',
      `${inviterName} invited you to join the "${familyName}" family workspace on Umuryango.`,
      '',
      `Accept the invite: ${inviteUrl}`,
      '',
      `This invite expires in ${expiresInDays} days.`,
      'If you did not expect this, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">You're invited</h2>
        <p style="margin: 0 0 16px;">${inviterName} invited you to join the <strong>${familyName}</strong> family workspace on Umuryango.</p>
        <p style="margin: 0 0 16px; text-align: center;">
          <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; border-radius: 12px; text-decoration: none;">Accept invitation</a>
        </p>
        <p style="margin: 16px 0 0; color: #555;">This invite expires in ${expiresInDays} days. If you did not expect this, you can ignore this email.</p>
      </div>`;

    try {
      await this.transporter?.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send family invite email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
