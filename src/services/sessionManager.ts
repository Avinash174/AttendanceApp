import { resetToLogin } from '../navigation/navigationRef';

type SessionExpiredHandler = () => void | Promise<void>;

let sessionExpiredHandler: SessionExpiredHandler | null = null;
let isHandlingExpiry = false;

export const setSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  sessionExpiredHandler = handler;
};

export const isUnauthorizedError = (status?: number, message?: string): boolean => {
  const text = (message ?? '').toLowerCase();

  if (status === 401) {
    return true;
  }

  const isTokenMessage =
    text.includes('token is not valid') ||
    text.includes('invalid token') ||
    text.includes('jwt expired') ||
    text.includes('token expired') ||
    text.includes('session expired') ||
    text.includes('authentication required') ||
    text.includes('not authenticated') ||
    (text.includes('token') && text.includes('expired'));

  if (status === 403) {
    // Permission errors (e.g. admin-only routes) should not force logout.
    if (
      text.includes('admin access denied') ||
      text.includes('permission denied') ||
      text.includes('access denied') ||
      text.includes('forbidden')
    ) {
      return isTokenMessage;
    }

    return isTokenMessage;
  }

  return isTokenMessage;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) {
      return false;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized)) as { exp?: number };

    if (!payload.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
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
