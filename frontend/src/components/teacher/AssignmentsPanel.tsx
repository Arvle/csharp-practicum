import React, { useState } from 'react';
import { assignmentsApi } from '../../api/assignments';
import { Assignment } from '../../api/types';
import { useTranslation } from '../../locales';

interface AssignmentsPanelProps {
  assignments: Assignment[];
  onChanged: () => void;
}

export const AssignmentsPanel: React.FC<AssignmentsPanelProps> = ({
  assignments,
  onChanged,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialCode, setInitialCode] = useState('Console.WriteLine("Hello");');
  const [expectedOutput, setExpectedOutput] = useState('Hello');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInitialCode('Console.WriteLine("Hello");');
    setExpectedOutput('Hello');
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.teacher.assignmentsForm.titleRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await assignmentsApi.create({
        title: title.trim(),
        description: description.trim() || '—',
        initialCode: initialCode.trim(),
        expectedOutput: expectedOutput.trim(),
      });
      resetForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.unknown);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.teacher.assignmentsForm.confirmDelete)) return;
    setBusy(true);
    setError(null);
    try {
      await assignmentsApi.delete(id);
      onChanged();
    } catch (err) {
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
        {/* Create form */}
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
                  disabled={busy}
                  spellCheck={false}
                />
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
            <button type="submit" className="btn-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner-sm" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  <i className="fas fa-plus" aria-hidden />
                  {t.teacher.assignmentsForm.create}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing assignments */}
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
