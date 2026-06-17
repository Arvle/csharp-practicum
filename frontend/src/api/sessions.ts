import { apiClient } from './client';
import { Session, SessionParticipant } from './types';

export interface CreateSessionData { title: string; expiresHours?: number }

export const sessionsApi = {
  create: (data: CreateSessionData) => apiClient.post<Session>('/sessions', data),
  getTeacher: () => apiClient.get<Session[]>('/sessions/teacher'),
  revoke: (id: number) => apiClient.delete<void>(`/sessions/${id}`),
  getParticipantsCount: (id: number) => apiClient.get<{ count: number }>(`/sessions/${id}/participants`),
  getParticipants: (id: number) => apiClient.get<SessionParticipant[]>(`/sessions/${id}/participants/list`),
};