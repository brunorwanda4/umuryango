import type { Request } from 'express';

export const ACCESS_COOKIE_NAME = 'rf_access_token';
export const REFRESH_COOKIE_NAME = 'rf_refresh_token';
export const NATIVE_CLIENT_HEADER = 'x-umuryango-client';
export const NATIVE_CLIENT_IDENTIFIER = 'tauri-native';

export function isNativeClientRequest(request: Request): boolean {
  const headerValue = request.headers?.[NATIVE_CLIENT_HEADER];
  if (typeof headerValue === 'string') {
    return headerValue.trim().toLowerCase() === NATIVE_CLIENT_IDENTIFIER;
  }
  return false;
}

export function extractAccessTokenFromRequest(
  request: Request,
): string | undefined {
  const cookieToken = request.cookies?.[ACCESS_COOKIE_NAME] as
    | string
    | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice('Bearer '.length).trim();
    if (bearer) {
      return bearer;
    }
  }

  return undefined;
}

