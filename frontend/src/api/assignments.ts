import { apiClient } from './client';
import { Assignment } from './types';

export type AssignmentCreate = Pick<
  Assignment,
  'title' | 'description' | 'initialCode' | 'expectedOutput'
>;

export const assignmentsApi = {
  getAll: () => apiClient.get<Assignment[]>('/assignments'),
  
  getById: (id: number) => apiClient.get<Assignment>(`/assignments/${id}`),
  
  create: (data: AssignmentCreate) => 
    apiClient.post<Assignment>('/assignments', data),
  
  update: (id: number, data: Partial<Assignment>) => 
    apiClient.put<Assignment>(`/assignments/${id}`, data),
  
  delete: (id: number) => apiClient.delete<void>(`/assignments/${id}`)
};