import { useState, useCallback } from 'react';
import { submissionsApi } from '../../../api/submissions';
import { Submission, StudentWithStats } from '../../../api/types';
import { useNotifications, Notification } from '../../common/hooks/useNotifications'; 
import { useTranslation } from '../../../locales';

export const useGrading = (
  students: StudentWithStats[],
  setStudents: React.Dispatch<React.SetStateAction<StudentWithStats[]>>,
  submissions: Submission[],
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>
) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotifications();
  const { t } = useTranslation();

  const handleGradeSubmit = useCallback(async () => {
    if (!selectedSubmission || !selectedStudent) return;

    setIsSubmitting(true);

    try {
      await submissionsApi.grade(selectedSubmission.id, grade, comment);

      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id
          ? { 
              ...s, 
              grade,
              lastSubmission: s.lastSubmission ? {
                ...s.lastSubmission, 
                grade, 
                teacherComment: comment 
              } : undefined
            } 
          : s
      ));

      setSubmissions(prev => prev.map(s =>
        s.id === selectedSubmission.id
          ? { ...s, grade, teacherComment: comment }
          : s
      ));

      showNotification('success', t.notifications.gradeSaved);
      closeGrading();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.notifications.gradeFailed;
      showNotification('error', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSubmission, selectedStudent, grade, comment, setStudents, setSubmissions, showNotification, t]);

  const openGrading = useCallback((student: StudentWithStats, submission: Submission) => {
    setSelectedStudent(student);
    setSelectedSubmission(submission);
    setGrade(submission.grade || 5);
    setComment(submission.teacherComment || '');
  }, []);

  const closeGrading = useCallback(() => {
    setSelectedSubmission(null);
    setSelectedStudent(null);
    setGrade(5);
    setComment('');
  }, []);

  return {
    selectedStudent,
    selectedSubmission,
    grade,
    comment,
    setGrade,
    setComment,
    handleGradeSubmit,
    openGrading,
    closeGrading,
    isSubmitting
  };
};