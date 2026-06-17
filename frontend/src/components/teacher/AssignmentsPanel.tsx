import React, { useState, useCallback } from 'react';
import { assignmentsApi, AssignmentCreate } from '../../api/assignments';
import { Assignment, TestCase, Resource } from '../../api/types';
import { useTranslation } from '../../locales';

interface AssignmentsPanelProps {
  assignments: Assignment[];
  onChanged: () => void;
  selectedSessionId: number | null;
}

export const AssignmentsPanel: React.FC<AssignmentsPanelProps> = ({
  assignments,
  onChanged,
  selectedSessionId,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialCode, setInitialCode] = useState<string>('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [draftAssignmentId, setDraftAssignmentId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInitialCode('');
    setExpectedOutput('');
    setTestCases([]);
    setResources([]);
    setDraftAssignmentId(null);
    setError(null);
  };

  const buildPayload = useCallback((): AssignmentCreate | null => {
    if (!selectedSessionId) {
      setError('Выберите урок для создания задания');
      return null;
    }
    if (!title.trim()) {
      setError(t.teacher.assignmentsForm.titleRequired);
      return null;
    }

    const cleanedTestCases = testCases.filter(
      (tc) => tc.input.trim() !== '' || tc.expected.trim() !== ''
    );

    return {
      title: title.trim(),
      description: description.trim() || '—',
      initialCode: initialCode.trim() || undefined,
      expectedOutput: expectedOutput.trim(),
      sessionId: selectedSessionId,
      testCases: cleanedTestCases.length > 0 ? JSON.stringify(cleanedTestCases) : undefined,
      resources: resources.length > 0 ? JSON.stringify(resources) : undefined,
    };
  }, [description, expectedOutput, initialCode, resources, selectedSessionId, t.teacher.assignmentsForm.titleRequired, testCases, title]);

  const addTestCase = useCallback(() => {
    setTestCases(prev => [...prev, { input: '', expected: '', hidden: false }]);
  }, []);

  const removeTestCase = useCallback((index: number) => {
    setTestCases(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateTestCase = useCallback((index: number, field: keyof TestCase, value: string | boolean) => {
    setTestCases(prev => prev.map((tc, i) => 
      i === index ? { ...tc, [field]: value } : tc
    ));
  }, []);

  const ensureDraftAssignment = useCallback(async (): Promise<number | null> => {
    if (draftAssignmentId !== null) return draftAssignmentId;

    const payload = buildPayload();
    if (!payload) return null;

    const created = await assignmentsApi.create(payload);
    setDraftAssignmentId(created.id);
    onChanged();
    return created.id;
  }, [buildPayload, draftAssignmentId, onChanged]);

  const handleUploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.currentTarget;
    const file = inputElement.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const assignmentId = await ensureDraftAssignment();
      if (assignmentId === null) return;

      const resource = await assignmentsApi.uploadResource(assignmentId, file);
      setResources(prev => [...prev, resource]);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errors.unknown);
    } finally {
      inputElement.value = '';
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    setBusy(true);
    setError(null);
    try {
      if (draftAssignmentId !== null) {
        await assignmentsApi.update(draftAssignmentId, payload);
      } else {
        await assignmentsApi.create(payload);
      }
      resetForm();
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errors.unknown);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedSessionId) return;
    if (!window.confirm(t.teacher.assignmentsForm.confirmDelete)) return;
    setBusy(true);
    setError(null);
    try {
      await assignmentsApi.delete(id, selectedSessionId);
      if (draftAssignmentId === id) resetForm();
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errors.unknown);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="assignments-panel" aria-labelledby="assignments-panel-title">
      <div className="panel-header">
        <h2 id="assignments-panel-title" className="panel-title">
          <i className="fas fa-clipboard-list" aria-hidden />
          {t.teacher.assignmentsPanelTitle}
        </h2>
        <p className="panel-lead">{t.teacher.assignmentsPanelLead}</p>
      </div>
      <div className="panel-body">
        <div className="create-form-card">
          <h3 className="create-form-title">
            <i className="fas fa-plus-circle" aria-hidden />
            Новое задание
          </h3>
          <form className="create-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="assign-title">{t.teacher.assignmentsForm.title}</label>
                <input
                  id="assign-title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.teacher.assignmentsForm.titlePh}
                  disabled={busy}
                />
              </div>
              <div className="form-field">
                <label htmlFor="assign-desc">{t.teacher.assignmentsForm.description}</label>
                <input
                  id="assign-desc"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.teacher.assignmentsForm.descriptionPh}
                  disabled={busy}
                />
              </div>
              <div className="form-field form-field-full">
                <label htmlFor="assign-code">{t.teacher.assignmentsForm.initialCode}</label>
                <textarea
                  id="assign-code"
                  className="form-input form-input-mono"
                  rows={4}
                  value={initialCode}
                  onChange={(e) => setInitialCode(e.target.value)}
                  placeholder="Оставьте пустым для чистого листа"
                  disabled={busy}
                  spellCheck={false}
                />
              </div>

            <div className="form-field form-field-full">
  <label>Тест-кейсы</label>
  <div className="test-cases-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {testCases.map((tc, idx) => (
      <div 
        key={idx} 
        className="test-case-row" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr auto auto', 
          gap: '12px', 
          alignItems: 'start',
          padding: '12px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <textarea
          placeholder="Ввод (можно использовать Enter)"
          value={tc.input}
          onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
          className="form-input form-input-mono"
          rows={3}
          style={{ resize: 'vertical', minHeight: '60px' }}
        />
        <textarea
          placeholder="Ожидаемый вывод"
          value={tc.expected}
          onChange={(e) => updateTestCase(idx, 'expected', e.target.value)}
          className="form-input form-input-mono"
          rows={3}
          style={{ resize: 'vertical', minHeight: '60px' }}
        />
        <label 
          className="checkbox-label" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px', 
            paddingTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <input
            type="checkbox"
            checked={tc.hidden}
            onChange={(e) => updateTestCase(idx, 'hidden', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Скрытый
        </label>
        <button 
          type="button" 
          className="btn-icon-danger"
          onClick={() => removeTestCase(idx)}
          title="Удалить тест-кейс"
          style={{ marginTop: '4px' }}
        >
          <i className="fas fa-trash" aria-hidden />
        </button>
      </div>
    ))}
  </div>
  <button 
    type="button" 
    className="btn btn-sm btn-secondary"
    onClick={addTestCase}
    style={{ marginTop: '12px', width: 'fit-content' }}
  >
    <i className="fas fa-plus" /> Добавить тест-кейс
  </button>
</div>

              <div className="form-field form-field-full">
                <label>Материалы (PDF)</label>
                <div className="resources-list">
                  {resources.map((res, idx) => (
                    <div key={`${res.url}-${idx}`} className="resource-item">
                      <span className="resource-title">{res.title}</span>
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                        <i className="fas fa-external-link-alt" aria-hidden />
                      </a>
                      <button 
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => setResources(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <i className="fas fa-trash" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleUploadPDF}
                  disabled={uploading || busy || !selectedSessionId}
                  className="file-input"
                />
                {uploading && <span className="uploading">Загрузка...</span>}
                {draftAssignmentId !== null && (
                  <span className="uploading">Материалы прикрепляются к заданию #{draftAssignmentId}</span>
                )}
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="assign-output">{t.teacher.assignmentsForm.expectedOutput}</label>
                <input
                  id="assign-output"
                  className="form-input"
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  disabled={busy}
                  spellCheck={false}
                />
              </div>
            </div>
            {error && (
              <div className="alert alert-error" role="alert">
                <i className="fas fa-exclamation-triangle" aria-hidden />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="btn-submit" disabled={busy || uploading}>
              {busy ? (
                <>
                  <span className="spinner-sm" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  <i className="fas fa-plus" aria-hidden />
                  {draftAssignmentId !== null ? 'Сохранить задание' : t.teacher.assignmentsForm.create}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="existing-assignments-card">
          <h3 className="existing-title">
            <i className="fas fa-list" aria-hidden />
            Существующие задания
          </h3>
          {assignments.length === 0 ? (
            <p className="existing-empty">{t.teacher.assignmentsEmpty}</p>
          ) : (
            <div className="existing-list">
              {assignments.map((a) => (
                <div key={a.id} className="existing-item">
                  <div className="existing-item-info">
                    <strong>{a.title}</strong>
                    <span className="existing-item-desc">{a.description}</span>
                  </div>
                  <div className="existing-item-output">
                    <code>{a.expectedOutput}</code>
                  </div>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => handleDelete(a.id)}
                    disabled={busy}
                    title={t.common.delete}
                  >
                    <i className="fas fa-trash" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};