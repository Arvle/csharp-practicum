import { apiClient } from './client';
import { User } from './types';

export interface TeacherLoginData { login: string; password: string }
export interface JoinSessionData { fullName: string }

export const teacherLogin = (data: TeacherLoginData) =>
  apiClient.post<{token: string; user: User}>('/auth/teacher/login', data);

export const joinSession = (token: string, data: JoinSessionData) =>
  apiClient.post<{token: string; user: User}>(`/auth/join?token=${token}`, data);