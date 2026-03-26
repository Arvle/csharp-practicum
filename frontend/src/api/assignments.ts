import { apiClient } from './client';
import { Assignment } from './types';

export const assignmentsApi = {
  getAll: () => apiClient.get<Assignment[]>('/assignments'),
  
  getById: (id: number) => apiClient.get<Assignment>(`/assignments/${id}`),
  
  create: (data: Omit<Assignment, 'id' | 'createdAt'>) => 
    apiClient.post<Assignment>('/assignments', data),
  
  update: (id: number, data: Partial<Assignment>) => 
    apiClient.put<Assignment>(`/assignments/${id}`, data),
  
  delete: (id: number) => apiClient.delete<void>(`/assignments/${id}`)
};