import { apiClient } from './client';
import { User } from './types';

export interface StudentLoginData {
  studentId: string;
}

export interface TeacherLoginData {
  accessCode: string;
  group: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const studentLogin = (data: StudentLoginData): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/auth/student/login', data);
};

export const teacherLogin = (data: TeacherLoginData): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/auth/teacher/login', data);
};