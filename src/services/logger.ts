const SENSITIVE_KEYS = new Set([
  'password',
  'Password',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
]);

const maskValue = (key: string, value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  if (key === 'token' || key === 'refreshToken' || key === 'accessToken') {
    return value.length > 12 ? `${value.slice(0, 8)}...` : '***';
  }

  return '***';
};

export const sanitizeForLog = (value: unknown): unknown => {
  if (value instanceof FormData) {
    return '[FormData]';
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeForLog(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (result, [key, entryValue]) => {
        result[key] = SENSITIVE_KEYS.has(key) ? maskValue(key, entryValue) : sanitizeForLog(entryValue);
        return result;
      },
      {},
    );
  }

  return value;
};

export const logApiRequest = (method: string, url: string, body?: unknown) => {
  const sanitizedBody = body ? sanitizeForLog(body) : undefined;
  console.log('[API Request]', method, url, sanitizedBody ? JSON.stringify(sanitizedBody, null, 2) : '');
};

export const logApiResponse = (url: string, status: number, body: unknown) => {
  const sanitizedBody = sanitizeForLog(body);
  console.log('[API Response]', url, status, sanitizedBody ? JSON.stringify(sanitizedBody, null, 2) : '');
};

export const logApiError = (url: string, error: unknown, details?: unknown) => {
  const sanitizedDetails = details ? sanitizeForLog(details) : undefined;
  console.warn('[API Error]', url, error, sanitizedDetails ? JSON.stringify(sanitizedDetails, null, 2) : '');
};
