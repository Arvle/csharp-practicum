import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../api/assignments';
import { submissionsApi } from '../api/submissions';
import { sessionsApi } from '../api/sessions';
import { Submission } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

export const useTeacherData = () => {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ['teacher-sessions'],
    queryFn: () => sessionsApi.getTeacher(),
    enabled: !!user,
    refetchInterval: 12_000,
    select: (data) => data ?? [],
  });

  const sessionsDataQuery = useQuery({
    queryKey: ['session-data', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId || selectedSessionId <= 0) {
        return { assignments: [], submissions: [], participants: [] };
      }
      const [assignments, submissions, participants] = await Promise.all([
        assignmentsApi.getAll({ session_id: String(selectedSessionId) }),
        submissionsApi.getAll({ session_id: String(selectedSessionId) }),
        sessionsApi.getParticipants(selectedSessionId),
      ]);
      return {
        assignments: assignments ?? [],
        submissions: submissions ?? [],
        participants: participants ?? [],
      };
    },
    enabled: !!selectedSessionId && selectedSessionId > 0,
    refetchInterval: 12_000,
  });

  const sessions = sessionsQuery.data ?? [];
  const assignments = sessionsDataQuery.data?.assignments ?? [];
  const submissions = sessionsDataQuery.data?.submissions ?? [];
  const participants = sessionsDataQuery.data?.participants ?? [];

  const loading = sessionsQuery.isLoading || sessionsDataQuery.isLoading;
  const error = (sessionsQuery.error || sessionsDataQuery.error)?.message || null;

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  const studentProgress = useMemo(() => {
    const userMap = new Map<number, Map<number, Submission>>();
    const userNames = new Map<number, string>();

    participants.forEach(participant => {
      userMap.set(participant.id, new Map());
      userNames.set(participant.id, participant.fullName);
    });

    submissions.forEach(sub => {
      if (!userMap.has(sub.userId)) {
        userMap.set(sub.userId, new Map());
      }
      if (!userNames.has(sub.userId)) {
        userNames.set(sub.userId, sub.studentName || `User #${sub.userId}`);
      }

      const userAssignments = userMap.get(sub.userId)!;
      const existing = userAssignments.get(sub.assignmentId);
      if (!existing || new Date(sub.submittedAt) > new Date(existing.submittedAt)) {
        userAssignments.set(sub.assignmentId, sub);
      }
    });

    return Array.from(userMap.entries()).map(([userId, assignmentsMap]) => ({
      id: userId,
      name: userNames.get(userId) || `User #${userId}`,
      assignments: assignmentsMap,
    }));
  }, [participants, submissions]);

  const stats = useMemo(() => {
    const totalStudents = studentProgress.length;
    const activeStudents = studentProgress.filter(student => student.assignments.size > 0).length;

    let totalSubmissions = 0;
    let completedAssignments = 0;
    let totalGradeSum = 0;
    let gradedCount = 0;

    studentProgress.forEach(student => {
      student.assignments.forEach(sub => {
        totalSubmissions++;
        if (sub.status === 'done') completedAssignments++;
        if (sub.grade != null && sub.grade > 0) {
          totalGradeSum += sub.grade;
          gradedCount++;
        }
      });
    });

    return {
      joined: totalStudents,
      submitted: activeStudents,
      completed: completedAssignments,
      inProgress: Math.max(totalStudents - activeStudents, 0),
      averageGrade: gradedCount > 0 ? totalGradeSum / gradedCount : 0,
      totalSubmissions,
    };
  }, [studentProgress]);

  return {
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    assignments,
    submissions,
    studentProgress,
    loading,
    error,
    stats,
    refresh: () => {
      sessionsQuery.refetch();
      if (selectedSessionId && selectedSessionId > 0) {
        sessionsDataQuery.refetch();
      }
    }
  };
};
