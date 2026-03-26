import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { assignmentsApi } from '../../../api/assignments';
import { submissionsApi } from '../../../api/submissions'; 
import { Assignment, Submission } from '../../../api/types';
import { useTranslation } from '../../../locales';

export const useStudentData = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        assignmentsApi.getAll(),
        submissionsApi.getByStudent(user.id) 
      ]);
      
      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      
      if (assignmentsData && assignmentsData.length > 0 && !selectedId) {
        setSelectedId(assignmentsData[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknown;
      setError(message);
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getAssignmentStatus = useCallback((assignmentId: number): 'pending' | 'done' | 'incorrect' => {
    const submission = submissions.find(s => s.assignmentId === assignmentId);
    if (!submission) return 'pending';
    return submission.isCorrect ? 'done' : 'incorrect';
  }, [submissions]);

  const getStatusText = useCallback((status: string): string => {
    switch(status) {
      case 'done': return t.student.status.done;
      case 'incorrect': return t.student.status.incorrect;
      default: return t.student.status.pending;
    }
  }, [t]);

  const refreshSubmissions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await submissionsApi.getByStudent(user.id); 
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to refresh submissions:', err);
    }
  }, [user]);

  const selectAssignment = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const currentAssignment = assignments.find(a => a.id === selectedId) || null;

  return {
    assignments,
    submissions,
    loading,
    error,
    selectedId,
    currentAssignment,
    getAssignmentStatus,
    getStatusText,
    refreshSubmissions,
    selectAssignment,
    setSubmissions
  };
};