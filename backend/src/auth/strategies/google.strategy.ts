import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';

export type GoogleUser = {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      done(new Error('Google account has no email.'), undefined);
      return;
    }

    const user: GoogleUser = {
      googleId: profile.id,
      email,
      fullName: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    done(null, user);
  }
}
