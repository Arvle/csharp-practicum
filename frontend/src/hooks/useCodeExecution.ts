import { useState, useCallback } from 'react';
import { submissionsApi } from '../api/submissions';
import { executeApi } from '../api/execute';
import { useNotifications } from '../components/common/hooks/useNotifications';
import { useTranslation } from '../locales';

export const useCodeExecution = (
  assignmentId: number | null,
  onSubmissionComplete?: () => void
) => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotifications();
  const { t } = useTranslation();

  const handleRun = useCallback(async () => {
    setLoading(true);
    setOutput(['⏳ ' + t.common.loading]);

    try {
      const result = await executeApi.run(code);

      const outputLines: string[] = [];
      if (result.output) {
        outputLines.push(...result.output.split('\n'));
      }
      if (result.error) {
        outputLines.push('⚠️ ' + result.error);
      }

      setOutput(
        outputLines.length
          ? outputLines
          : result.success
            ? ['✓ Program executed (no output)']
            : ['❌ ' + (result.error || t.errors.unknown)]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.errors.unknown;
      setOutput(['❌ ' + message]);
    } finally {
      setLoading(false);
    }
  }, [code, t]);

  const handleSubmit = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setOutput(['⏳ ' + t.student.submit]);

    try {
      const result = await submissionsApi.create({
        assignmentId,
        code,
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
      if (result.errorMessage) {
        outputLines.push('⚠️ ' + result.errorMessage);
      }

      setOutput(outputLines);
      onSubmissionComplete?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.errors.unknown;
      setOutput(['❌ ' + message]);
      showNotification('error', t.notifications.submissionFailed);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, code, onSubmissionComplete, showNotification, t]);

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
    handleReset,
  };
};
