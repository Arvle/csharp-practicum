import { apiClient } from './client';
import type { CompilationResult } from './types';

export const executeApi = {
  run: (code: string) =>
    apiClient.post<CompilationResult>('/execute', { code }),
};
