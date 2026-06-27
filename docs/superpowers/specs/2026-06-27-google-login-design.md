# Google Login — Design Spec

**Date:** 2026-06-27
**Status:** Approved, ready for implementation plan
**Scope:** Add "Login with Google" using a backend-driven OAuth 2.0 Authorization Code flow, wired across NestJS backend and Next.js frontend. Google-auth only — building out the `/me` "create new family" prompt is explicitly out of scope.

## Goal

Let a user authenticate with their Google account. The result is the same authenticated session (access + refresh cookies) the existing email/password flow produces, so all downstream code is unchanged. New Google users get an account created automatically; existing email/password users get their Google identity linked by verified email.

## Decisions

- **Flow:** Backend-driven Authorization Code flow via `passport-google-oauth20`. Client secret stays server-side; matches the existing redirect + cookie session model.
- **Schema:** Extend `User` (Option A — no separate OAuth table; YAGNI, only Google needed now).
- **Account linking:** Auto-link by email. Google emails are pre-verified, so linking sets `emailVerifiedAt`.
- **Redirect target:** `FRONTEND_URL + /me` after a successful callback.

## 1. Database (Prisma)

Modify `backend/prisma/schema.prisma`, `User` model:

```prisma
model User {
  // ...existing fields...
  passwordHash String?   // was required (String) -> now optional; OAuth users have no password
  googleId     String?  @unique   // NEW
  avatarUrl    String?            // NEW
  // ...
}
```

- `passwordHash` becomes nullable. Existing rows are unaffected.
- `googleId` unique so a Google account maps to at most one user.
- Apply with `pnpm prisma migrate dev --name add-google-oauth` (backend uses pnpm per root AGENTS.md).

**Code impact of nullable `passwordHash`:** `auth.service.ts` `login()` calls `compare(loginDto.password, user.passwordHash)`. Add a guard: if `user.passwordHash` is null (Google-only account), reject with the same generic `UnauthorizedException('Invalid login credentials.')` (no enumeration leak) — they must use Google or set a password via reset later.

## 2. Backend (NestJS)

### Module wiring — `auth.module.ts`
- Add `PassportModule` to imports.
- Add `GoogleStrategy` to providers.

### Strategy — `auth/strategies/google.strategy.ts` (new)
- Extends `PassportStrategy(Strategy, 'google')` from `passport-google-oauth20`.
- Config from `ConfigService.getOrThrow`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
- `scope: ['email', 'profile']`.
- `validate(accessToken, refreshToken, profile)` returns a normalized object: `{ googleId, email, fullName, avatarUrl }` sourced from `profile.id`, `profile.emails[0].value` (lowercased), `profile.displayName`, `profile.photos[0]?.value`.

### Service — `auth.service.ts`, new method `loginWithGoogle(googleUser, context): Promise<LoginResult>`
Logic:
1. Find user by `googleId`. If found → go to step 4 (login).
2. Else find by `email` (lowercased):
   - **Found** → link: update user `{ googleId, avatarUrl, emailVerifiedAt: emailVerifiedAt ?? now }`.
   - **Not found** → create user: `{ email, fullName, googleId, avatarUrl, emailVerifiedAt: now, passwordHash: null, status: ACTIVE }`.
3. (account now exists)
4. Write `AuthAuditEvent` (`action: LOGIN`, `result: SUCCESS`, `emailOrMobile: email`, ip/ua from context).
5. Return `createSessionAndTokens(user, context)` — reuses the existing helper, identical cookie behavior.

### Controller — `auth.controller.ts`
- `GET /api/v1/auth/google` — guarded by `@UseGuards(AuthGuard('google'))`. Empty handler; the guard triggers the redirect to Google.
- `GET /api/v1/auth/google/callback` — guarded by `@UseGuards(AuthGuard('google'))`. Reads `req.user` (the strategy's `validate` output), calls `authService.loginWithGoogle`, sets cookies via the existing private `setAuthCookies(response, loginResult)`, then `response.redirect(\`${FRONTEND_URL}/me\`)`.
- Both decorated with Swagger `@ApiOperation` / `@ApiExcludeEndpoint` as appropriate (callback is browser-only).

## 3. Config / Env

Add to `backend/.env.example`:
```
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4915/api/v1/auth/google/callback"
```
Real values come from Google Cloud Console → OAuth 2.0 Client ID, with the callback URL added as an authorized redirect URI.

## 4. Frontend (Next.js + shadcn/ui)

- Add a **"Continue with Google"** button to both `login-form.tsx` and `register-form.tsx`, below the existing submit button with a separator.
- It is a full-page navigation (anchor / link), **not** a `fetch` — OAuth requires a real browser redirect. Target: `${NEXT_PUBLIC_API_URL}/api/v1/auth/google` (reuse the same base-URL resolution already in `login-form.tsx`'s `getLoginUrl`).
- Use shadcn `Button` `variant="outline"`, full width, rounded-full to match existing buttons. Google "G" icon via the project's configured icon library, passed as an object per AGENTS UI rules.
- Label text added to `frontend/src/messages/en.json` (i18n-ready; no hard-coded user-facing strings).
- No client state needed — when the browser returns to `/me`, cookies are already set by the backend callback.

## 5. Security

- CSRF `state` parameter is handled by `passport-google-oauth20`.
- Client secret never reaches the browser (backend-driven flow).
- Google-provided email is treated as verified — Google verifies email ownership.
- Existing cookie options reused (`httpOnly`, `secure` in prod, `sameSite`).
- Login with a null `passwordHash` is rejected generically (no user enumeration).

## 6. Testing

Service unit tests for `loginWithGoogle`:
- New user → creates user with `emailVerifiedAt` set, `passwordHash` null.
- Existing email/password user → links `googleId`, leaves password intact.
- Existing `googleId` → logs in, no duplicate create.
- `login()` with null `passwordHash` → throws `UnauthorizedException`.

## Out of Scope

- `/me` "create new family?" prompt (separate feature — needs family-create API + membership check).
- Other OAuth providers (GitHub, etc.). Schema can migrate to an `OAuthAccount` table later if needed.
- Linking/unlinking management UI.
