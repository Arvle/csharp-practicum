import { apiClient } from './client';
import { Assignment, AssignmentRaw, Resource } from './types';

export interface AssignmentCreate {
  title: string;
  description: string;
  initialCode?: string;
  expectedOutput?: string;
  sessionId: number;
  testCases?: string;
  resources?: string;
}

const safeParseArray = <T>(value: string | T[] | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
};

const parseAssignment = (raw: AssignmentRaw): Assignment => ({
  ...raw,
  testCases: safeParseArray(raw.testCases),
  resources: safeParseArray(raw.resources),
});

export const assignmentsApi = {
  getAll: async (params?: Record<string, string>) => {
    const data = await apiClient.get<AssignmentRaw[]>('/assignments', params);
    return data.map(parseAssignment);
  },
  create: async (data: AssignmentCreate) => {
    const assignment = await apiClient.post<AssignmentRaw, AssignmentCreate>('/assignments', data);
    return parseAssignment(assignment);
  },
  update: async (id: number, data: AssignmentCreate) => {
    const assignment = await apiClient.patch<AssignmentRaw, AssignmentCreate>(`/assignments/${id}`, data);
    return parseAssignment(assignment);
  },
  uploadResource: async (assignmentId: number, file: File): Promise<Resource> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<Resource>(`/assignments/${assignmentId}/resources`, formData);
  },
  delete: (id: number, sessionId: number) => apiClient.delete<void>(`/assignments/${id}?session_id=${sessionId}`),
};