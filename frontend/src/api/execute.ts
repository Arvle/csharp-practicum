import { apiClient } from './client';
import type { CompilationResult } from './types';

export const executeApi = {
  run: (code: string, input?: string) =>
    apiClient.post<CompilationResult>('/execute', { code, input }),
};
