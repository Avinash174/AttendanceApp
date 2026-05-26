import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';
import { AuthSession, LoginCredentials, LoginResponse } from '../types/auth';
import { apiRequest, ApiError } from './apiClient';
import { logApiError } from './logger';

const AUTH_SESSION_KEY = '@attendance/auth-session';

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return Boolean(
    session.token &&
      session.refreshToken &&
      session.user &&
      typeof session.user === 'object' &&
      session.user.UserName,
  );
};

export const saveAuthSession = async (session: AuthSession) => {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  if (session.user.fkEmpId !== undefined && session.user.fkEmpId !== null) {
    await AsyncStorage.setItem('@attendance/fk-emp-id', session.user.fkEmpId.toString());
  }
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  const storedSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession);

    if (!isAuthSession(parsedSession)) {
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      await AsyncStorage.removeItem('@attendance/fk-emp-id');
      return null;
    }

    return parsedSession;
  } catch (error) {
    logApiError('auth-session', 'Failed to parse stored session', error);
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    await AsyncStorage.removeItem('@attendance/fk-emp-id');
    return null;
  }
};

export const clearAuthSession = async () => {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  await AsyncStorage.removeItem('@attendance/fk-emp-id');
};

export const getStoredFkEmpId = async (): Promise<number | null> => {
  const empId = await AsyncStorage.getItem('@attendance/fk-emp-id');
  if (empId) {
    const parsed = parseInt(empId, 10);
    return isNaN(parsed) ? null : parsed;
  }

  // Fallback to active session
  const session = await getAuthSession();
  return session?.user?.fkEmpId ?? null;
};

export const loginWithCredentials = async (
  credentials: LoginCredentials,
): Promise<AuthSession> => {
  const username = credentials.UserName.trim();
  const password = credentials.Password.trim();

  if (!username || !password) {
    throw new ApiError('Enter both username and password.');
  }

  try {
    const response = await apiRequest<LoginResponse>(API_ENDPOINTS.login, {
      method: 'POST',
      body: {
        username: username,
        password: password,
      },
    });

    if (!response?.success) {
      throw new ApiError('Login failed. Please check your credentials.');
    }

    if (!response.token || !response.refreshToken || !response.user) {
      throw new ApiError('Login response is missing required authentication data.');
    }

    const session: AuthSession = {
      token: response.token,
      refreshToken: response.refreshToken,
      user: response.user,
    };

    await saveAuthSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError) {
      logApiError(API_ENDPOINTS.login, error.message, error.data);
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'Something went wrong while signing in.';

    logApiError(API_ENDPOINTS.login, message, error);
    throw new ApiError(message);
  }
};
