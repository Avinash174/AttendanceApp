import { resetToLogin } from '../navigation/navigationRef';

type SessionExpiredHandler = () => void | Promise<void>;

let sessionExpiredHandler: SessionExpiredHandler | null = null;
let isHandlingExpiry = false;

export const setSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  sessionExpiredHandler = handler;
};

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const payload = JSON.parse(atob(`${normalized}${padding}`)) as { exp?: number };

    return payload;
  } catch {
    return null;
  }
};

export const isUnauthorizedError = (status?: number, message?: string): boolean => {
  const text = (message ?? '').toLowerCase();

  // 401 means the auth token is invalid or expired.
  if (status === 401) {
    return true;
  }

  // 403 is usually a permission issue (admin route, role mismatch), not session expiry.
  if (status === 403) {
    return false;
  }

  return (
    text.includes('token is not valid') ||
    text.includes('invalid token') ||
    text.includes('jwt expired') ||
    text.includes('token expired') ||
    text.includes('session expired') ||
    text.includes('authentication required') ||
    text.includes('not authenticated') ||
    (text.includes('token') && text.includes('expired'))
  );
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  // Treat token as expired slightly before server time to avoid edge-case 401s.
  const expiryBufferMs = 30_000;
  return Date.now() >= payload.exp * 1000 - expiryBufferMs;
};

export const notifySessionExpired = async () => {
  if (isHandlingExpiry || !sessionExpiredHandler) {
    return;
  }

  isHandlingExpiry = true;

  try {
    await sessionExpiredHandler();
    resetToLogin();
  } finally {
    setTimeout(() => {
      isHandlingExpiry = false;
    }, 1500);
  }
};
