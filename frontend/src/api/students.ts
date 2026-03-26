import { apiClient } from './client';
import type { StudentListItem } from './types';

export const studentsApi = {
  getAll: () => apiClient.get<StudentListItem[]>('/students'),
};
