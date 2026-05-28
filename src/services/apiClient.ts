import { API_BASE_URL } from '../config/api';
import { logApiError, logApiRequest, logApiResponse } from './logger';
import { isUnauthorizedError, notifySessionExpired } from './sessionManager';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

const getErrorMessage = (status: number, body: unknown): string => {
  if (body && typeof body === 'object') {
    const payload = body as Record<string, unknown>;
    const message = payload.message ?? payload.error ?? payload.Message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  return `Request failed with status ${status}.`;
};

const ensureBaseUrl = () => {
  if (!API_BASE_URL.trim() || API_BASE_URL.includes('your-server.com')) {
    throw new ApiError('Set API_BASE_URL in src/config/api.ts before signing in.');
  }
};

const REQUEST_TIMEOUT_MS = 10000;

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, headers = {}, token }: ApiRequestOptions = {},
): Promise<T> => {
  ensureBaseUrl();

  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  logApiRequest(method, url, body);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const requestBody =
      body instanceof FormData ? body : (body === undefined ? undefined : JSON.stringify(body));
    const request = fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new ApiError('Connection timed out. Please check your network or API IP address.'));
      }, REQUEST_TIMEOUT_MS);
    });

    const response = await Promise.race([request, timeout]);

    const responseBody = await parseResponseBody(response);
    logApiResponse(url, response.status, responseBody);

    if (!response.ok) {
      const message = getErrorMessage(response.status, responseBody);
      logApiError(url, message, responseBody);

      if (token && isUnauthorizedError(response.status, message)) {
        void notifySessionExpired();
      }

      throw new ApiError(message, response.status, responseBody);
    }

    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'Unable to reach the server. Check your connection.';

    logApiError(url, message, error);
    throw new ApiError(message);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
