import React, { useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../hooks/useStudentData';
import { useCodeExecution } from '../../hooks/useCodeExecution';
import { useAssignmentDraft } from '../../hooks/useAssignmentDraft';
import { useNotifications, Notification } from '../common/hooks/useNotifications';
import { UserMenu } from '../common/UserMenu';
import { StudentSidebar } from './components/StudentSidebar';
import { EditorSection } from './components/EditorSection';
import { OutputSection } from './components/OutputSection';
import { useTranslation } from '../../locales';
import { clearDraft } from '../../utils/draftStorage';

export const StudentView: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const { t } = useTranslation();

  const {
    assignments,
    loading: dataLoading,
    selectedId,
    currentAssignment,
    getAssignmentStatus,
    getStatusText,
    refreshSubmissions,
    selectAssignment,
  } = useStudentData();

  const afterSubmit = useCallback(() => {
    refreshSubmissions();
    if (user && selectedId !== null) {
      clearDraft(user.id, selectedId);
    }
  }, [user, selectedId, refreshSubmissions]);

  const {
    code,
    setCode,
    input,
    setInput,
    output,
    setOutput,
    loading: execLoading,
    handleRun,
    handleSubmit,
    handleReset,
  } = useCodeExecution(selectedId, afterSubmit);

  useAssignmentDraft(
    user?.id,
    selectedId,
    code,
    setCode,
    currentAssignment?.initialCode
  );

  const resetToInitial = useCallback(() => {
    if (!currentAssignment || !user || selectedId === null) return;
    clearDraft(user.id, selectedId);
    handleReset(currentAssignment.initialCode);
  }, [currentAssignment, user, selectedId, handleReset]);

  if (dataLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <i className="fas fa-spinner fa-spin" aria-hidden />
          <p>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-layout">
      {notifications.map((n: Notification) => (
        <div key={n.id} className={`notification ${n.type}`} role="status">
          <i
            className={`fas fa-${
              n.type === 'success'
                ? 'check-circle'
                : n.type === 'error'
                  ? 'exclamation-circle'
                  : 'info-circle'
            }`}
            aria-hidden
          />
          {n.message}
        </div>
      ))}

      <StudentSidebar
        assignments={assignments}
        selectedId={selectedId}
        onSelect={selectAssignment}
        getStatus={getAssignmentStatus}
        getStatusText={getStatusText}
      />

      <div className="student-main">
        {/* Top bar */}
        <header className="student-topbar">
          <div className="student-topbar-left">
            {currentAssignment && (
              <div className="breadcrumb">
                <span className="breadcrumb-kicker">{t.student.workspaceKicker}</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-title">{currentAssignment.title}</span>
              </div>
            )}
          </div>
          <div className="student-topbar-right">
            <UserMenu />
          </div>
        </header>

        {!currentAssignment ? (
          <div className="student-empty-main">
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-inbox" aria-hidden />
              </div>
              <h2>{t.student.noAssignments}</h2>
              <p>{t.student.noAssignmentsHint}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Assignment info bar */}
            <div className="assignment-info-bar">
              <div className="assignment-meta">
                <p className="assignment-description">{currentAssignment.description}</p>
                <div className="expected-output-chip">
                  <i className="fas fa-bullseye" aria-hidden />
                  <span>{currentAssignment.expectedOutput || '—'}</span>
                </div>
              </div>
              <div className="assignment-actions">
                <button type="button" className="btn btn-ghost" onClick={resetToInitial}>
                  <i className="fas fa-undo" aria-hidden />
                  {t.editor.reset}
                </button>
              </div>
            </div>

            {/* Draft hint */}
            <div className="draft-hint">
              <i className="fas fa-save" aria-hidden />
              {t.student.draftHint}
            </div>

            {/* Editor + Output */}
            <div className="editor-container">
              <EditorSection code={code} onChange={setCode} onRun={handleRun} />
              <OutputSection
                output={output}
                input={input}
                onInputChange={setInput}
                loading={execLoading}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onClear={() => setOutput([])}
                showSubmit
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
