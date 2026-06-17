import { getToken, clearAuth, getUser } from '../utils/token';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
const MAX_RETRIES = 2;

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

class ApiClientError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_BASE;
    this.timeout = API_TIMEOUT;
  }

  private normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};
    if (!headers) return result;

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    }

    return { ...headers };
  }

  private handleUnauthorized(): never {
    const user = getUser();
    clearAuth();

    if (user?.role === 'student') {
      window.alert('Сессия завершена. Повторно перейдите по ссылке урока.');
      window.location.href = '/';
    } else {
      window.location.href = '/login';
    }

    throw new ApiClientError('Unauthorized', 401);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, attempt = 1): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = getToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...this.normalizeHeaders(options.headers),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.handleUnauthorized();
      }

      if (!response.ok) {
        const error = await response.json().catch((): ApiErrorPayload => ({ error: response.statusText }));
        if (response.status >= 500 && attempt <= MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return this.request<T>(endpoint, options, attempt + 1);
        }
        throw new ApiClientError(error.error || error.message || `HTTP ${response.status}`, response.status);
      }

      if (response.status === 204) return {} as T;
      return await response.json() as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Превышено время ожидания сервера');
      }
      if (attempt <= MAX_RETRIES && !(error instanceof SyntaxError)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return this.request<T>(endpoint, options, attempt + 1);
      }
      throw error;
    }
  }

  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${qs}`, { method: 'GET' });
  }

  post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  postForm<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();