import { apiClient } from './client';
import { Submission, SubmissionDto } from './types';

export const submissionsApi = {
  create: (data: SubmissionDto) => 
    apiClient.post<Submission>('/submissions', data),
  
  getByAssignment: (assignmentId: number) => 
    apiClient.get<Submission[]>(`/submissions/assignment/${assignmentId}`),
  
  getByStudent: (studentId: number) => 
    apiClient.get<Submission[]>(`/submissions/student/${studentId}`),
  
  getAll: () => 
    apiClient.get<Submission[]>('/submissions'),
  
  grade: (id: number, grade: number, comment: string) => 
    apiClient.post<{ message: string }>(`/submissions/${id}/grade`, { grade, comment })
};