import { useState, useCallback } from 'react';
import { submissionsApi } from '../../../api/submissions';
import { useNotifications } from '../../common/hooks/useNotifications';
import { useTranslation } from '../../../locales';

export const useCodeExecution = (
  assignmentId: number | null,
  studentId: number,
  onSubmissionComplete?: () => void
) => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotifications();
  const { t } = useTranslation();

  const handleRun = useCallback(async () => {
    if (!assignmentId) return;
    
    setLoading(true);
    setOutput(['⏳ ' + t.common.loading]);
    
    try {
      const result = await submissionsApi.create({ 
        assignmentId,
        studentId,
        code
      });
      
      const outputLines: string[] = [];
      if (result.output) {
        outputLines.push(...result.output.split('\n'));
      }
      if (result.errorMessage) {
        outputLines.push('⚠️ ' + result.errorMessage);
      }
      
      setOutput(outputLines.length ? outputLines : ['✓ Program executed (no output)']);
    } catch (error: any) {
      setOutput(['❌ ' + (error.message || t.errors.unknown)]);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, studentId, code, t]);

  const handleSubmit = useCallback(async () => {
    if (!assignmentId) return;
    
    setLoading(true);
    setOutput(['⏳ ' + t.student.submit]);
    
    try {
      const result = await submissionsApi.create({ 
        assignmentId,
        studentId,
        code
      });
      
      const outputLines: string[] = [];
      if (result.isCorrect) {
        outputLines.push(t.notifications.correct);
        showNotification('success', t.notifications.submissionSuccess);
      } else {
        outputLines.push(t.notifications.incorrect);
        showNotification('error', t.notifications.submissionFailed);
      }
      
      if (result.output) {
        outputLines.push('📤 ' + t.student.output + ':');
        outputLines.push(...result.output.split('\n'));
      }
      
      setOutput(outputLines);
      onSubmissionComplete?.();
    } catch (error: any) {
      setOutput(['❌ ' + (error.message || t.errors.unknown)]);
      showNotification('error', t.notifications.submissionFailed);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, studentId, code, onSubmissionComplete, showNotification, t]);

  const handleReset = useCallback((initialCode: string) => {
    setCode(initialCode);
    setOutput([]);
  }, []);

  return {
    code,
    setCode,
    output,
    setOutput,
    loading,
    handleRun,
    handleSubmit,
    handleReset
  };
};