import { TOKEN_KEY, USER_KEY } from '../config/constants';
import type { User } from '../api/types';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<User>;
  return (
    typeof candidate.id === 'number' &&
    (candidate.role === 'student' || candidate.role === 'teacher') &&
    typeof candidate.fullName === 'string'
  );
};

export const getUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    const parsed: unknown = JSON.parse(user);
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuth = (): void => {
  removeToken();
  removeUser();
};