import { apiClient } from './client';

export interface StudentDraft {
  assignmentId: number;
  code: string;
  updatedAt?: string;
}

export const draftsApi = {
  get: (assignmentId: number) => apiClient.get<StudentDraft>(`/drafts/${assignmentId}`),
  save: (assignmentId: number, code: string) => apiClient.put<StudentDraft, { code: string }>(`/drafts/${assignmentId}`, { code }),
};
