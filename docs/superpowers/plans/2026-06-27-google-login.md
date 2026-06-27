# Google Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Continue with Google" authentication using a backend-driven OAuth 2.0 Authorization Code flow, producing the same cookie session as email/password login.

**Architecture:** NestJS uses `passport-google-oauth20` for two routes (`GET /api/v1/auth/google` to start, `GET /api/v1/auth/google/callback` to finish). The callback service finds/links/creates the user, reuses the existing `createSessionAndTokens` + cookie helper, then redirects the browser to the frontend `/me`. The Next.js login and register forms get a full-page-navigation Google button.

**Tech Stack:** NestJS 11, Prisma 7 (PostgreSQL), `@nestjs/passport` + `passport-google-oauth20`, Next.js (App Router, custom build), shadcn/ui, lucide-react, Jest.

## Global Constraints

- Backend package manager: **pnpm** only (`pnpm <script>`, `pnpm add`, `pnpm exec`). Never npm/yarn/bun in `backend/`.
- Frontend package manager/runtime: **Bun** only (`bun run`, `bunx`). Never npm/pnpm/yarn in `frontend/`.
- Frontend is a **custom Next.js build** — read `frontend/node_modules/next/dist/docs/` before writing Next-specific code; APIs may differ from training data.
- No hard-coded user-facing strings — all copy goes through `frontend/src/messages/en.json` (i18n-ready).
- shadcn/ui: use semantic color tokens (`bg-background`, `text-muted-foreground`), `variant`/`size` before custom styles, `cn()` for conditional classes. `className` is layout only.
- Auth must keep using the existing JWT access/refresh **cookie** session model — reuse `createSessionAndTokens` and `setAuthCookies`; do not invent a new session mechanism.
- API routes are versioned under `/api/v1`.
- Never log tokens, secrets, or OAuth credentials. Client secret stays server-side.
- Backend Jest specs are `*.spec.ts` under `backend/src` (config in `backend/package.json`).

---

## File Structure

**Backend (`backend/`)**
- `prisma/schema.prisma` — modify `User` (nullable `passwordHash`, add `googleId`, `avatarUrl`).
- `src/auth/strategies/google.strategy.ts` — NEW Passport strategy + `GoogleUser` type.
- `src/auth/auth.service.ts` — modify: add `loginWithGoogle()`, guard `login()` against null `passwordHash`.
- `src/auth/auth.service.spec.ts` — NEW unit tests.
- `src/auth/auth.controller.ts` — modify: add `google` + `google/callback` routes.
- `src/auth/auth.module.ts` — modify: register `PassportModule` + `GoogleStrategy`.
- `.env.example` — modify: add Google OAuth vars.

**Frontend (`frontend/`)**
- `src/components/icons/google-icon.tsx` — NEW inline Google "G" SVG (lucide has no brand icon).
- `src/messages/en.json` — modify: add `continueWithGoogle` to `LoginForm` and `RegisterForm`.
- `src/app/auth/login/login-form.tsx` — modify: add Google button + copy type field.
- `src/app/auth/register/register-form.tsx` — modify: add Google button + copy type field.

---

### Task 1: Database schema — Google fields + nullable password

**Files:**
- Modify: `backend/prisma/schema.prisma` (User model, ~lines 33-50)

**Interfaces:**
- Produces: `User.googleId: string | null` (unique), `User.avatarUrl: string | null`, `User.passwordHash: string | null` on the generated Prisma Client. Later tasks rely on these field names.

**Note:** `datasource db` has no inline `url`; Prisma reads `DATABASE_URL` from `backend/.env` (already configured locally, per `.env.example`). The migrate step needs the local Postgres running.

- [ ] **Step 1: Edit the `User` model**

In `backend/prisma/schema.prisma`, change the `passwordHash` line and add two fields:

```prisma
model User {
  id              String           @id @default(cuid())
  email           String           @unique
  phoneNumber     String?          @unique
  fullName        String
  gender          String?
  passwordHash    String?
  googleId        String?          @unique
  avatarUrl       String?
  status          UserStatus       @default(ACTIVE)
  emailVerifiedAt DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  authSessions       AuthSession[]
  authAuditEvents    AuthAuditEvent[]
  emailVerifications EmailVerification[]
  passwordResets     PasswordReset[]

  @@index([status])
}
```

- [ ] **Step 2: Validate the schema**

Run: `cd backend && pnpm exec prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Create and apply the migration**

Run: `cd backend && pnpm exec prisma migrate dev --name add-google-oauth`
Expected: migration created under `prisma/migrations/`, applied, and `Generated Prisma Client` printed. (Requires local Postgres up.)

- [ ] **Step 4: Verify the client has the new fields**

Run: `cd backend && pnpm exec prisma generate && node -e "const fs=require('fs');const p=require('path');const dir=require('@prisma/client');console.log('googleId' )"`
Simpler verification — Run: `cd backend && pnpm exec tsc --noEmit` (should still pass; confirms no schema/type breakage so far).
Expected: no output / exit 0.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(db): add googleId/avatarUrl and make passwordHash optional"
```

---

### Task 2: Backend deps + Google Passport strategy + module wiring

**Files:**
- Create: `backend/src/auth/strategies/google.strategy.ts`
- Modify: `backend/src/auth/auth.module.ts`

**Interfaces:**
- Produces: `GoogleStrategy` (Nest provider, strategy name `'google'`) and exported type `GoogleUser = { googleId: string; email: string; fullName: string; avatarUrl: string | null }`. Tasks 3 and 4 import `GoogleUser` from `./strategies/google.strategy`.

- [ ] **Step 1: Install dependencies (pnpm)**

Run:
```bash
cd backend && pnpm add @nestjs/passport passport passport-google-oauth20 && pnpm add -D @types/passport-google-oauth20
```
Expected: packages added to `backend/package.json`, no errors.

- [ ] **Step 2: Create the strategy file**

Create `backend/src/auth/strategies/google.strategy.ts`:

```ts
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
```

- [ ] **Step 3: Wire the module**

Edit `backend/src/auth/auth.module.ts`. Add the `PassportModule` import and `GoogleStrategy` provider:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: 15 * 60,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && pnpm exec tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml backend/src/auth/strategies/google.strategy.ts backend/src/auth/auth.module.ts
git commit -m "feat(auth): add Google passport strategy and module wiring"
```

---

### Task 3: Service — `loginWithGoogle` + guard `login()` against null password (TDD)

**Files:**
- Create: `backend/src/auth/auth.service.spec.ts`
- Modify: `backend/src/auth/auth.service.ts`

**Interfaces:**
- Consumes: `GoogleUser` from `./strategies/google.strategy`; existing private `createSessionAndTokens(user, context)` and `writeLoginAudit(...)`.
- Produces: `AuthService.loginWithGoogle(googleUser: GoogleUser, context: RequestContext): Promise<LoginResult>`. Task 4 calls it.

- [ ] **Step 1: Write the failing tests**

Create `backend/src/auth/auth.service.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
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
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('access-token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('30') } },
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
    prisma.user.findFirst.mockResolvedValue({ ...baseUser, passwordHash: null });

    await expect(
      service.login({ emailOrMobile: 'new.user@example.com', password: 'x' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pnpm test -- auth.service.spec`
Expected: FAIL — `loginWithGoogle` does not exist / type errors.

- [ ] **Step 3: Add the import and `loginWithGoogle` method**

In `backend/src/auth/auth.service.ts`, add the import near the other `./` imports:

```ts
import type { GoogleUser } from './strategies/google.strategy';
```

Add this method to `AuthService` (place it right after the `login()` method, before the `// ─── Forgot Password ───` section):

```ts
async loginWithGoogle(
  googleUser: GoogleUser,
  context: RequestContext,
): Promise<LoginResult> {
  const email = googleUser.email.toLowerCase();

  let user = await this.prisma.user.findUnique({
    where: { googleId: googleUser.googleId },
  });

  if (!user) {
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: googleUser.fullName,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE,
        },
      });
    }
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedException('This account is disabled.');
  }

  await this.writeLoginAudit({
    emailOrMobile: email,
    result: AuthAuditResult.SUCCESS,
    context,
    userId: user.id,
    action: AuthAuditAction.LOGIN,
  });

  return this.createSessionAndTokens(user, context);
}
```

- [ ] **Step 4: Guard `login()` against null `passwordHash`**

In `backend/src/auth/auth.service.ts`, in `login()`, change the first guard so a Google-only account (no password) cannot be password-logged-in. Replace:

```ts
		if (!user || user.status !== UserStatus.ACTIVE) {
```

with:

```ts
		if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
```

(This runs before `compare(loginDto.password, user.passwordHash)`, so `compare` never receives null. The generic failure message is unchanged — no enumeration leak.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pnpm test -- auth.service.spec`
Expected: PASS (4 passing).

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth/auth.service.ts backend/src/auth/auth.service.spec.ts
git commit -m "feat(auth): add loginWithGoogle service and guard password login"
```

---

### Task 4: Controller routes + env vars

**Files:**
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/.env.example`

**Interfaces:**
- Consumes: `AuthService.loginWithGoogle`, existing private `setAuthCookies`, `GoogleUser`.
- Produces: `GET /api/v1/auth/google` and `GET /api/v1/auth/google/callback`.

- [ ] **Step 1: Add imports**

In `backend/src/auth/auth.controller.ts`, add `Get` and `UseGuards` to the `@nestjs/common` import, add `AuthGuard`, `ApiExcludeEndpoint`, and the `GoogleUser` type:

```ts
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
```

Add to the existing `@nestjs/swagger` import list: `ApiExcludeEndpoint`.

Add with the other `./` imports:

```ts
import type { GoogleUser } from './strategies/google.strategy';
```

- [ ] **Step 2: Add the two routes**

In `AuthController`, add these methods right after the `login()` method (before `forgotPassword`):

```ts
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
```

(Note: the callback uses `@Res()` without `passthrough` because it calls `response.redirect` directly. `setAuthCookies` only calls `response.cookie`, which is compatible.)

- [ ] **Step 3: Add env vars to `.env.example`**

Append to `backend/.env.example`:

```
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4915/api/v1/auth/google/callback"
```

- [ ] **Step 4: Verify compile + full backend test suite**

Run: `cd backend && pnpm exec tsc --noEmit && pnpm test`
Expected: exit 0; all specs pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/auth.controller.ts backend/.env.example
git commit -m "feat(auth): add Google OAuth start and callback routes"
```

---

### Task 5: Frontend Google icon + i18n copy

**Files:**
- Create: `frontend/src/components/icons/google-icon.tsx`
- Modify: `frontend/src/messages/en.json` (`LoginForm`, `RegisterForm`)

**Interfaces:**
- Produces: `GoogleIcon` React component (accepts standard `svg` props incl. `data-icon`, `className`); `en.json` keys `LoginForm.continueWithGoogle` and `RegisterForm.continueWithGoogle`. Task 6 consumes both.

**Note:** lucide-react has no Google brand glyph, so we ship the official multicolor SVG.

- [ ] **Step 1: Create the icon component**

Create `frontend/src/components/icons/google-icon.tsx`:

```tsx
import type { ComponentProps } from "react";

export const GoogleIcon = (props: ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.31 14.32a7.2 7.2 0 0 1 0-4.63V6.6H1.3a12 12 0 0 0 0 10.8l4.01-3.08Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.74c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.3 6.6l4.01 3.09C6.25 6.84 8.89 4.74 12 4.74Z"
    />
  </svg>
);
```

- [ ] **Step 2: Add the `LoginForm` copy key**

In `frontend/src/messages/en.json`, in the `LoginForm` object, add after `"forgotPassword": "Forgot password?",`:

```json
    "continueWithGoogle": "Continue with Google",
```

- [ ] **Step 3: Add the `RegisterForm` copy key**

In `frontend/src/messages/en.json`, in the `RegisterForm` object, add after `"haveAccount": "I already have an account",`:

```json
    "continueWithGoogle": "Continue with Google",
```

- [ ] **Step 4: Verify JSON + types**

Run: `cd frontend && bunx tsc --noEmit`
Expected: exit 0 (no syntax error in en.json import, no type errors).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/icons/google-icon.tsx frontend/src/messages/en.json
git commit -m "feat(auth): add Google icon and continue-with-google copy"
```

---

### Task 6: Frontend Google buttons on login + register forms

**Files:**
- Modify: `frontend/src/app/auth/login/login-form.tsx`
- Modify: `frontend/src/app/auth/register/register-form.tsx`

**Interfaces:**
- Consumes: `GoogleIcon` from `@/components/icons/google-icon`; `copy.continueWithGoogle`.

**Note:** the button is a real full-page navigation to the backend (cross-origin) — OAuth requires it. Use `Button asChild` wrapping a plain `<a href>` so the browser does a hard navigation (not a client-side route).

- [ ] **Step 1: login-form — add icon import + copy field**

In `frontend/src/app/auth/login/login-form.tsx`:

Add to imports:

```ts
import { GoogleIcon } from "@/components/icons/google-icon";
```

Add to the `LoginFormCopy` type (after `forgotPassword: string;`):

```ts
  continueWithGoogle: string;
```

- [ ] **Step 2: login-form — add the Google URL helper**

In `login-form.tsx`, add below the existing `getLoginUrl` function:

```ts
const getGoogleUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:4915";
  const baseUrl = configuredUrl.replace(/\/$/, "");

  if (baseUrl.endsWith("/api/v1")) {
    return `${baseUrl}/auth/google`;
  }

  return `${baseUrl}/api/v1/auth/google`;
};
```

- [ ] **Step 3: login-form — render the button**

In `login-form.tsx`, inside the `<div className="flex flex-col items-center gap-5">` block, add the Google button immediately after the submit `<Button>` and before the forgot-password `<Button>`:

```tsx
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-11 w-full rounded-full text-sm font-semibold"
        >
          <a href={getGoogleUrl()}>
            <GoogleIcon data-icon="inline-start" />
            {copy.continueWithGoogle}
          </a>
        </Button>
```

- [ ] **Step 4: register-form — add icon import + copy field**

In `frontend/src/app/auth/register/register-form.tsx`:

Add to imports:

```ts
import { GoogleIcon } from "@/components/icons/google-icon";
```

Add to the `RegisterFormCopy` type (after `haveAccount: string;`):

```ts
  continueWithGoogle: string;
```

- [ ] **Step 5: register-form — render the button**

In `register-form.tsx`, in the final `return` (the register step), inside the `<div className="flex flex-col items-center gap-3">` button column, add the Google button after the submit `<Button>` and before the `haveAccount` `<Button>`. It reuses the existing `getAuthUrl("google")` helper:

```tsx
        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          <a href={getAuthUrl("google")}>
            <GoogleIcon data-icon="inline-start" />
            {copy.continueWithGoogle}
          </a>
        </Button>
```

- [ ] **Step 6: Verify typecheck + build**

Run: `cd frontend && bunx tsc --noEmit && bun run build`
Expected: typecheck exit 0; build succeeds. (If `build` is slow/unavailable in the environment, `bunx tsc --noEmit` alone is the gate.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/auth/login/login-form.tsx frontend/src/app/auth/register/register-form.tsx
git commit -m "feat(auth): add Continue with Google button to login and register"
```

---

## Manual verification (after all tasks)

Requires real Google OAuth credentials in `backend/.env` and both servers running.

1. Google Cloud Console → create an OAuth 2.0 Client ID (Web application). Add `http://localhost:4915/api/v1/auth/google/callback` as an authorized redirect URI. Copy client id/secret into `backend/.env`.
2. Start backend (`cd backend && pnpm dev`) and frontend (`cd frontend && bun run dev`).
3. Open the login page → click "Continue with Google" → complete Google consent.
4. Expect: redirect back to `/me`, logged in (access + refresh cookies set; check DevTools → Application → Cookies).
5. Re-run with a Google account whose email matches an existing email/password user → expect the same user, now with `googleId` populated (verify in DB).

---

## Self-Review

- **Spec coverage:** Schema (Task 1) ✓; backend flow strategy/service/controller (Tasks 2–4) ✓; config/env (Task 4) ✓; frontend button + i18n + icon (Tasks 5–6) ✓; security — state via passport, secret server-side, Google email trusted, null-password guard (Tasks 2–4) ✓; tests — service unit tests for create/link/existing/null-password (Task 3) ✓.
- **Out of scope honored:** no `/me` build, no extra providers, no link-management UI.
- **Type consistency:** `GoogleUser` defined in Task 2, consumed identically in Tasks 3–4. `loginWithGoogle(googleUser, context)` signature matches across service def (Task 3) and controller call (Task 4). `continueWithGoogle` key consistent across en.json (Task 5) and both copy types (Task 6).
- **Placeholders:** none — all steps contain concrete code/commands.
- **Note on frontend tests:** the frontend has no unit-test harness; frontend tasks gate on `tsc --noEmit`/`build` plus the manual OAuth verification, which is appropriate for a redirect-only UI button.
