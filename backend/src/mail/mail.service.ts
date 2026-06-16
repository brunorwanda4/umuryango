import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

type VerificationEmailInput = {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
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
    const subject = 'Your Rwanda Family verification code';
    const text = [
      `Hi ${fullName},`,
      '',
      `Your Rwanda Family verification code is: ${code}`,
      '',
      `This code expires in ${expiresInMinutes} minutes.`,
      'If you did not create this account, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="margin: 0 0 16px;">Hi ${fullName}, use the code below to finish creating your Rwanda Family account.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 0; text-align: center; background: #f4f4f5; border-radius: 12px;">${code}</div>
        <p style="margin: 16px 0 0; color: #555;">This code expires in ${expiresInMinutes} minutes. If you did not request it, ignore this email.</p>
      </div>`;

    try {
      await this.transporter.sendMail({
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
}
