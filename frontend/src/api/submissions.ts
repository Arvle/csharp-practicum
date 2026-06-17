import { apiClient } from './client';
import { Submission } from './types';

export interface SubmissionDto {
  assignmentId: number;
  code: string;
  input?: string;
}

export const submissionsApi = {
  create: (data: SubmissionDto) => apiClient.post<Submission>('/submissions', data),
  getAll: (params?: Record<string, string>) => apiClient.get<Submission[]>('/submissions', params),
  grade: (id: number, grade: number, comment: string) => 
    apiClient.post<{ message: string }>(`/submissions/${id}/grade`, { grade, comment })
};