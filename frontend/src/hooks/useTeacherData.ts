import { useState, useEffect, useCallback } from 'react';
import { assignmentsApi } from '../api/assignments';
import { submissionsApi } from '../api/submissions';
import { Assignment, Submission, StudentWithStats } from '../api/types';
import { useTranslation } from '../locales';

export const useTeacherData = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        assignmentsApi.getAll(),
        submissionsApi.getAll()
      ]);
      
      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
      
      setStudents([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknown;
      setError(message);
      console.error('Failed to load teacher data:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    total: students.length,
    completed: students.filter(s => s.status === 'completed').length,
    inProgress: students.filter(s => s.status === 'in-progress').length,
    notStarted: students.filter(s => s.status === 'not-started').length,
    averageGrade: students.reduce((acc, s) => acc + (s.grade || 0), 0) / students.length || 0
  };

  const getStatusText = useCallback((status: string): string => {
    switch(status) {
      case 'completed': return t.teacher.status.completed;
      case 'in-progress': return t.teacher.status.inProgress;
      default: return t.teacher.status.notStarted;
    }
  }, [t]);

  const getStatusClass = useCallback((status: string): string => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-progress';
      default: return 'status-notstarted';
    }
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    students,
    setStudents,
    submissions,
    setSubmissions,
    assignments,
    loading,
    error,
    group,
    setGroup,
    stats,
    getStatusText,
    getStatusClass,
    refreshData
  };
};