import { useState, useCallback, useRef } from 'react';
import { submissionsApi } from '../api/submissions';
import { executeApi, WSTerminal } from '../api/execute';
import type { NotificationType } from '../components/common/hooks/useNotifications';

export type ExecState = 'idle' | 'compiling' | 'interactive' | 'finished' | 'error' | 'submitting';

type Notify = (type: NotificationType, message: string) => void;

export const useCodeExecution = (
  assignmentId: number | null,
  onSubmissionComplete?: (submittedCode: string) => void,
  notify?: Notify
) => {
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [state, setState] = useState<ExecState>('idle');
  const terminalRef = useRef<WSTerminal | null>(null);
  const isRunningRef = useRef(false);
  const submittedInputRef = useRef('');

  const closeTerminal = useCallback(() => {
    terminalRef.current?.close();
    terminalRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    closeTerminal();
    isRunningRef.current = false;
  }, [closeTerminal]);

  const handleRun = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    closeTerminal();
    submittedInputRef.current = '';
    setInput('');
    setState('compiling');
    setOutput(['⏳ Подготовка запуска...']);

    const terminal = executeApi.createTerminal();
    terminalRef.current = terminal;

    try {
      terminal
        .onOutput((out) => setOutput(prev => [...prev, out]))
        .onError((err) => setOutput(prev => [...prev, '❌ ' + err]))
        .onReady(() => {
          setState('interactive');
          isRunningRef.current = false;
        })
        .onExit(() => {
          isRunningRef.current = false;
          setState(prev => (prev === 'error' ? 'error' : 'finished'));
        });

      await terminal.connect(code);
    } catch (error: unknown) {
      isRunningRef.current = false;
      setState('error');
      setOutput(prev => [
        ...prev,
        '⚠️ Ошибка соединения: ' + (error instanceof Error ? error.message : String(error)),
      ]);
      closeTerminal();
    }
  }, [code, closeTerminal]);

  const handleInputSubmit = useCallback((text: string) => {
    if (state === 'interactive' && terminalRef.current) {
      const line = text.trimEnd();
      submittedInputRef.current += submittedInputRef.current ? `\n${line}` : line;
      setOutput(prev => [...prev, `> ${line}`]);
      terminalRef.current.sendInput(line);
      setInput('');
    }
  }, [state]);

  const handleSubmit = useCallback(async () => {
    if (!assignmentId) return;
    const submissionInput = submittedInputRef.current || input;

    setState('submitting');
    setOutput(prev => [...prev, '📤 Отправка решения...']);
    try {
      const result = await submissionsApi.create({ assignmentId, code, input: submissionInput });
      if (result.status === 'done') {
        notify?.('success', 'Решение верное!');
      } else if (result.status === 'incorrect') {
        notify?.('error', 'Решение не прошло проверку');
      } else {
        notify?.('info', 'Решение отправлено на проверку');
      }
      if (result.output) {
        setOutput(prev => [...prev, result.output]);
      }
      onSubmissionComplete?.(code);
      setState('finished');
    } catch {
      setState('error');
      notify?.('error', 'Ошибка отправки');
    }
  }, [assignmentId, code, input, onSubmissionComplete, notify]);

  const handleReset = useCallback((initialCode: string) => {
    setCode(initialCode);
    setInput('');
    submittedInputRef.current = '';
    setOutput([]);
    setState('idle');
    cleanup();
  }, [cleanup]);

  return {
    code, setCode,
    input, setInput,
    output, setOutput,
    state,
    handleRun,
    handleInputSubmit,
    handleSubmit,
    handleReset,
    cleanup,
    isRunning: state === 'compiling' || state === 'interactive' || state === 'submitting',
  };
};
