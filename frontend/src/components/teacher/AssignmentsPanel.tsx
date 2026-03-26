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
      <h2 id="assignments-panel-title" className="panel-title">
        <i className="fas fa-clipboard-list" aria-hidden />
        {t.teacher.assignmentsPanelTitle}
      </h2>
      <p className="panel-lead">{t.teacher.assignmentsPanelLead}</p>

      <form className="assignment-create-form" onSubmit={handleCreate}>
        <div className="form-grid">
          <label className="form-field">
            <span>{t.teacher.assignmentsForm.title}</span>
            <input
              className="login-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.teacher.assignmentsForm.titlePh}
              disabled={busy}
            />
          </label>
          <label className="form-field form-field-full">
            <span>{t.teacher.assignmentsForm.description}</span>
            <input
              className="login-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.teacher.assignmentsForm.descriptionPh}
              disabled={busy}
            />
          </label>
          <label className="form-field form-field-full">
            <span>{t.teacher.assignmentsForm.initialCode}</span>
            <textarea
              className="login-input code-area"
              rows={5}
              value={initialCode}
              onChange={(e) => setInitialCode(e.target.value)}
              disabled={busy}
              spellCheck={false}
            />
          </label>
          <label className="form-field form-field-full">
            <span>{t.teacher.assignmentsForm.expectedOutput}</span>
            <textarea
              className="login-input"
              rows={2}
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              disabled={busy}
              spellCheck={false}
            />
          </label>
        </div>
        {error && (
          <div className="login-error" role="alert">
            <i className="fas fa-exclamation-circle" aria-hidden />
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <>
              <i className="fas fa-spinner fa-spin" aria-hidden />
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

      <div className="assignments-table-wrap">
        <table className="assignments-mini-table">
          <thead>
            <tr>
              <th>{t.teacher.assignmentsForm.title}</th>
              <th>{t.teacher.assignmentsForm.expectedOutput}</th>
              <th>{t.teacher.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  {t.teacher.assignmentsEmpty}
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <div className="muted small">{a.description}</div>
                  </td>
                  <td>
                    <code className="expected-cell">{a.expectedOutput}</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(a.id)}
                      disabled={busy}
                    >
                      <i className="fas fa-trash" aria-hidden />
                      {t.common.delete}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
