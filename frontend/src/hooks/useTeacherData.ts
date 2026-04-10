import { useState, useEffect, useCallback, useMemo } from 'react';
import { assignmentsApi } from '../api/assignments';
import { submissionsApi } from '../api/submissions';
import { studentsApi } from '../api/students';
import { Assignment, Submission, StudentListItem, StudentWithStats } from '../api/types';
import { useTranslation } from '../locales';
import { useAuth } from '../contexts/AuthContext';

function buildStudentStats(
  roster: StudentListItem[],
  submissions: Submission[],
  assignments: Assignment[]
): StudentWithStats[] {
  return roster.map((student) => {
    const studentSubs = submissions
      .filter((s) => s.studentId === student.id)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    const lastSubmission = studentSubs[0];
    const assignmentCount = assignments.length;
    const correctCount = assignments.filter((a) =>
      studentSubs.some((s) => s.assignmentId === a.id && s.status === 'done')
    ).length;

    let status: StudentWithStats['status'] = 'not-started';
    if (assignmentCount === 0) {
      status = studentSubs.length > 0 ? 'in-progress' : 'not-started';
    } else if (correctCount === assignmentCount) {
      status = 'completed';
    } else if (studentSubs.length > 0) {
      status = 'in-progress';
    }

    return {
      id: student.id,
      name: student.fullName || student.username,
      studentId: student.studentId || student.username,
      group: student.group || '',
      status,
      lastSubmission,
      grade: lastSubmission?.grade,
      submissions: studentSubs,
    };
  });
}

export const useTeacherData = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState<StudentWithStats[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const group = user?.group || '';

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);

    try {
      const [assignmentsData, submissionsData, rosterData] = await Promise.all([
        assignmentsApi.getAll(),
        submissionsApi.getAll(),
        studentsApi.getAll(),
      ]);

      const adj = assignmentsData || [];
      const sub = submissionsData || [];
      const roster = rosterData || [];

      setAssignments(adj);
      setSubmissions(sub);
      setStudentStats(buildStudentStats(roster, sub, adj));
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknown;
      setError(message);
      console.error('Failed to load teacher data:', err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Smart polling: only when tab is visible, with longer interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const startPolling = () => {
      timer = setInterval(() => loadData(true), 30000);
    };

    const stopPolling = () => {
      clearInterval(timer);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        loadData(true);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  const students = useMemo(() => studentStats, [studentStats]);

  const stats = {
    total: students.length,
    completed: students.filter((s) => s.status === 'completed').length,
    inProgress: students.filter((s) => s.status === 'in-progress').length,
    notStarted: students.filter((s) => s.status === 'not-started').length,
    averageGrade:
      students.length === 0
        ? 0
        : students.reduce((acc, s) => acc + (s.grade || 0), 0) / students.length,
  };

  const getStatusText = useCallback(
    (status: string): string => {
      switch (status) {
        case 'completed':
          return t.teacher.status.completed;
        case 'in-progress':
          return t.teacher.status.inProgress;
        default:
          return t.teacher.status.notStarted;
      }
    },
    [t]
  );

  const getStatusClass = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-progress';
      default:
        return 'status-notstarted';
    }
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    students,
    setStudents: setStudentStats,
    submissions,
    setSubmissions,
    assignments,
    loading,
    error,
    group,
    stats,
    getStatusText,
    getStatusClass,
    refreshData,
  };
};
