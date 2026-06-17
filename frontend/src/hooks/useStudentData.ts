import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../api/assignments';
import { submissionsApi } from '../api/submissions';
import { useTranslation } from '../locales';

export const useStudentData = () => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => assignmentsApi.getAll(),
    refetchInterval: 12_000,
    select: (data) => data ?? [],
  });

  const submissionsQuery = useQuery({
    queryKey: ['student-submissions'],
    queryFn: () => submissionsApi.getAll(),
    refetchInterval: 12_000,
    select: (data) => data ?? [],
  });

  const assignments = assignmentsQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  
  const latestSubmissionByAssignment = useMemo(() => {
    const map = new Map<number, typeof submissions[number]>();
    submissions.forEach(submission => {
      const existing = map.get(submission.assignmentId);
      if (!existing || new Date(submission.submittedAt) > new Date(existing.submittedAt)) {
        map.set(submission.assignmentId, submission);
      }
    });
    return map;
  }, [submissions]);

  const currentAssignment = assignments.find(a => a.id === selectedId) || null;
  const currentSubmission = selectedId === null ? null : latestSubmissionByAssignment.get(selectedId) || null;

  const loading = assignmentsQuery.isLoading || submissionsQuery.isLoading;
  const error = (assignmentsQuery.error || submissionsQuery.error)?.message || null;

  useEffect(() => {
    if (assignments.length > 0 && selectedId === null) {
      setSelectedId(assignments[0].id);
    }
  }, [assignments.length, selectedId]);

  const getAssignmentStatus = useCallback((id: number): 'pending' | 'done' | 'incorrect' => {
    const sub = latestSubmissionByAssignment.get(id);
    if (!sub || sub.status === 'pending_review') return 'pending';
    return sub.status === 'done' ? 'done' : 'incorrect';
  }, [latestSubmissionByAssignment]);

  const getStatusText = (status: string) => {
    if (status === 'done') return t.student.status.done;
    if (status === 'incorrect') return t.student.status.incorrect;
    return t.student.status.pending;
  };

  const refreshSubmissions = () => {
    submissionsQuery.refetch();
    assignmentsQuery.refetch();
  };

  return {
    assignments,
    submissions,
    loading,
    error,
    selectedId,
    currentAssignment,
    currentSubmission,
    latestSubmissionByAssignment,
    getAssignmentStatus,
    getStatusText,
    refreshSubmissions,
    selectAssignment: setSelectedId,
    setSelectedId
  };
};