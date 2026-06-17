import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../../common/modal/Modal';
import { Submission, Assignment, CompilationResult, TestCase } from '../../../api/types';
import { executeApi } from '../../../api/execute';
import { useTranslation } from '../../../locales';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  assignment?: Assignment;
  grade: number;
  comment: string;
  onGradeChange: (grade: number) => void;
  onCommentChange: (comment: string) => void;
  onSave: () => void;
  busy?: boolean;
}

interface TeacherTestRunResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  error: string;
  hidden: boolean;
  passed: boolean;
  timeMs: number;
}

const normalizeOutput = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

const formatRunResult = (result: CompilationResult): string => {
  const lines = [
    result.success ? '✅ Выполнение завершено успешно' : '❌ Выполнение завершилось с ошибкой',
    `Время: ${result.timeMs} мс`,
  ];

  if (result.output.trim()) {
    lines.push('', 'Вывод:', result.output.trim());
  }
  if (result.error.trim()) {
    lines.push('', 'Ошибка:', result.error.trim());
  }

  return lines.join('\n');
};

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  assignment,
  grade,
  comment,
  onGradeChange,
  onCommentChange,
  onSave,
  busy = false,
}) => {
  const { t } = useTranslation();
  const [teacherInput, setTeacherInput] = useState('');
  const [teacherRunOutput, setTeacherRunOutput] = useState('');
  const [teacherRunBusy, setTeacherRunBusy] = useState(false);
  const [teacherTestResults, setTeacherTestResults] = useState<TeacherTestRunResult[]>([]);

  const testCases = useMemo<TestCase[]>(() => assignment?.testCases ?? [], [assignment?.testCases]);
  const hasTestCases = testCases.length > 0;

  useEffect(() => {
    setTeacherInput('');
    setTeacherRunOutput('');
    setTeacherRunBusy(false);
    setTeacherTestResults([]);
  }, [submission?.id]);

  const runStudentCode = useCallback(async () => {
    if (!submission) return;
    setTeacherRunBusy(true);
    setTeacherRunOutput('⏳ Запуск кода студента...');
    setTeacherTestResults([]);
    try {
      const result = await executeApi.run(submission.code, teacherInput);
      setTeacherRunOutput(formatRunResult(result));
    } catch (err: unknown) {
      setTeacherRunOutput(`❌ Ошибка запуска: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTeacherRunBusy(false);
    }
  }, [submission, teacherInput]);

  const runStudentTestCases = useCallback(async () => {
    if (!submission || testCases.length === 0) return;
    setTeacherRunBusy(true);
    setTeacherRunOutput('⏳ Проверка по тест-кейсам...');
    setTeacherTestResults([]);

    const results: TeacherTestRunResult[] = [];
    try {
      for (let i = 0; i < testCases.length; i += 1) {
        const testCase = testCases[i];
        const result = await executeApi.run(submission.code, testCase.input);
        results.push({
          index: i + 1,
          input: testCase.input,
          expected: testCase.expected,
          actual: result.output.trim(),
          error: result.error.trim(),
          hidden: Boolean(testCase.hidden),
          passed: result.success && normalizeOutput(result.output) === normalizeOutput(testCase.expected),
          timeMs: result.timeMs,
        });
      }

      const passedCount = results.filter(result => result.passed).length;
      setTeacherRunOutput(`Проверка завершена: ${passedCount}/${results.length} тест-кейсов пройдено.`);
      setTeacherTestResults(results);
    } catch (err: unknown) {
      setTeacherRunOutput(`❌ Ошибка проверки тест-кейсов: ${err instanceof Error ? err.message : String(err)}`);
      setTeacherTestResults(results);
    } finally {
      setTeacherRunBusy(false);
    }
  }, [submission, testCases]);

  if (!submission) return null;

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {t.common.cancel}
      </button>
      <button type="button" className="btn btn-success" onClick={onSave} disabled={busy}>
        {busy ? (
          <i className="fas fa-spinner fa-spin" aria-hidden />
        ) : (
          <i className="fas fa-save" aria-hidden />
        )}
        {t.teacher.grading.save}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t.teacher.grading.title}: ${submission.studentName || `ID: ${submission.userId}`}`}
      footer={footer}
      size="lg"
    >
      <div className="modal-section">
        <strong>{t.teacher.grading.assignment}:</strong>
        <div className="modal-value">{assignment?.title || t.teacher.empty}</div>
      </div>
      
      <div className="modal-section">
        <strong>{t.teacher.grading.code}:</strong>
        <div className="code-preview code-preview-readable">
          <pre>{submission.code}</pre>
        </div>
      </div>

      <div className="modal-section teacher-runner">
        <strong>Проверочный запуск преподавателя:</strong>
        <p className="teacher-runner-hint">
          Можно вручную выполнить код студента с нужным stdin или прогнать его по тест-кейсам задания.
        </p>
        <textarea
          className="grade-input teacher-runner-input"
          rows={3}
          value={teacherInput}
          onChange={(e) => setTeacherInput(e.target.value)}
          placeholder="Ввод для программы, например: 5 или несколько строк"
          disabled={teacherRunBusy}
          spellCheck={false}
        />
        <div className="teacher-runner-actions">
          <button type="button" className="btn btn-primary" onClick={runStudentCode} disabled={teacherRunBusy}>
            {teacherRunBusy ? <i className="fas fa-spinner fa-spin" aria-hidden /> : <i className="fas fa-play" aria-hidden />}
            Запустить код
          </button>
          <button type="button" className="btn btn-secondary" onClick={runStudentTestCases} disabled={teacherRunBusy || !hasTestCases}>
            <i className="fas fa-vial" aria-hidden />
            Проверить тест-кейсы
          </button>
        </div>
        {teacherRunOutput && (
          <div className="teacher-runner-output">
            <pre>{teacherRunOutput}</pre>
          </div>
        )}
        {teacherTestResults.length > 0 && (
          <div className="teacher-test-results">
            {teacherTestResults.map(result => (
              <div key={result.index} className={`teacher-test-result ${result.passed ? 'passed' : 'failed'}`}>
                <div className="teacher-test-result-head">
                  <strong>{result.passed ? '✅' : '❌'} Тест #{result.index}</strong>
                  <span>{result.timeMs} мс</span>
                </div>
                <div className="teacher-test-grid">
                  <div>
                    <span>Ввод</span>
                    <pre>{result.hidden ? 'Скрытый тест' : (result.input || '—')}</pre>
                  </div>
                  <div>
                    <span>Ожидалось</span>
                    <pre>{result.hidden ? 'Скрыто' : (result.expected || '—')}</pre>
                  </div>
                  <div>
                    <span>Получено</span>
                    <pre>{result.actual || '—'}</pre>
                  </div>
                </div>
                {result.error && <pre className="teacher-test-error">{result.error}</pre>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-section">
        <strong>{t.teacher.grading.executionResult}:</strong>
        <div className={`result-preview ${submission.isCorrect ? 'success' : 'error'}`}>
          <pre style={{ margin: 0, background: 'transparent' }}>
            {submission.output || t.teacher.empty}
          </pre>
        </div>
      </div>

      {submission.errorMessage && (
        <div className="modal-section">
          <strong>{t.teacher.grading.error}:</strong>
          <div className="result-preview error">
            <pre style={{ margin: 0, background: 'transparent' }}>
              {submission.errorMessage}
            </pre>
          </div>
        </div>
      )}

      <div className="grade-form">
        <div className="form-group">
          <label>{t.teacher.grading.grade}</label>
          <select
            className="grade-select"
            value={grade}
            onChange={(e) => onGradeChange(Number(e.target.value))}
            disabled={busy}
          >
            <option value="5">{t.teacher.grading.grades['5']}</option>
            <option value="4">{t.teacher.grading.grades['4']}</option>
            <option value="3">{t.teacher.grading.grades['3']}</option>
            <option value="2">{t.teacher.grading.grades['2']}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t.teacher.grading.comment}</label>
          <textarea
            className="grade-input"
            rows={3}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={t.teacher.grading.comment}
            disabled={busy}
          />
        </div>
      </div>
    </Modal>
  );
};