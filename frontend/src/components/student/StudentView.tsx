import React, { useCallback, useEffect } from 'react';
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
import { clearDraft, saveDraft } from '../../utils/draftStorage';
import { Resource } from '../../api/types';
import { draftsApi } from '../../api/drafts';

export const StudentView: React.FC = () => {
  const { user } = useAuth();
  const { notifications, showNotification } = useNotifications();
  const { t } = useTranslation();
  
  const {
    assignments,
    loading: dataLoading,
    selectedId,
    currentAssignment,
    currentSubmission,
    getAssignmentStatus,
    getStatusText,
    refreshSubmissions,
    selectAssignment,
  } = useStudentData();

  const afterSubmit = useCallback((submittedCode: string) => {
    refreshSubmissions();
    if (user && selectedId !== null) {
      const assignmentId = selectedId;
      saveDraft(user.id, assignmentId, submittedCode);
      draftsApi.save(assignmentId, submittedCode)
        .then(saved => saveDraft(user.id, assignmentId, saved.code, saved.updatedAt))
        .catch(() => undefined);
    }
  }, [user, selectedId, refreshSubmissions]);

  const {
    code,
    setCode,
    input,
    setInput,
    output,
    setOutput,
    state: execState,
    isRunning: execLoading,
    handleRun,
    handleSubmit,
    handleReset,
    handleInputSubmit,
    cleanup,
  } = useCodeExecution(selectedId, afterSubmit, showNotification);

  useAssignmentDraft(
    user?.id,
    selectedId,
    code,
    setCode,
    currentSubmission?.code ?? currentAssignment?.initialCode
  );

  const resetToInitial = useCallback(() => {
    if (!currentAssignment || !user || selectedId === null) return;
    clearDraft(user.id, selectedId);
    handleReset(currentAssignment.initialCode || '');
  }, [currentAssignment, user, selectedId, handleReset]);

  const openResource = useCallback((resource: Resource) => {
    if (resource.type === 'pdf' || resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup?.();
    };
  }, [cleanup]);

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
              n.type === 'success' ? 'check-circle' : 
              n.type === 'error' ? 'exclamation-circle' : 
              'info-circle'
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
            <div className="assignment-info-bar">
              <div className="assignment-meta">
                <p className="assignment-description">{currentAssignment.description}</p>
                

                {currentAssignment.resources?.length > 0 && (
                  <div className="resources-chips">
                    {currentAssignment.resources.map((res, idx) => (
                      <button
                        key={idx}
                        className="resource-chip"
                        onClick={() => openResource(res)}
                        title={res.title}
                      >
                        <i className={`fas fa-${res.type === 'pdf' ? 'file-pdf' : 'link'}`} aria-hidden />
                        {res.title}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="expected-output-chip">
                  <i className="fas fa-bullseye" aria-hidden />
                  <span>{currentAssignment.expectedOutput || '—'}</span>
                </div>

                {currentSubmission && (
                  <div className={`student-review-card ${currentSubmission.status === 'done' ? 'done' : currentSubmission.status === 'incorrect' ? 'incorrect' : 'pending'}`}>
                    <div className="student-review-head">
                      <span>
                        <i className="fas fa-clipboard-check" aria-hidden />
                        Последняя проверка
                      </span>
                      <time>{new Date(currentSubmission.submittedAt).toLocaleString()}</time>
                    </div>
                    <div className="student-review-grid">
                      <div>
                        <span className="student-review-label">Статус</span>
                        <strong>{getStatusText(getAssignmentStatus(currentAssignment.id))}</strong>
                      </div>
                      <div>
                        <span className="student-review-label">Оценка</span>
                        <strong>{currentSubmission.grade ?? '—'}</strong>
                      </div>
                    </div>
                    {currentSubmission.teacherComment && (
                      <div className="student-review-comment">
                        <span className="student-review-label">Комментарий преподавателя</span>
                        <p>{currentSubmission.teacherComment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="assignment-actions">
                <button type="button" className="btn btn-ghost" onClick={resetToInitial}>
                  <i className="fas fa-undo" aria-hidden />
                  {t.editor.reset}
                </button>
              </div>
            </div>

            <div className="draft-hint">
              <i className="fas fa-save" aria-hidden />
              {t.student.draftHint}
            </div>

            <div className="editor-container">
              <EditorSection code={code} onChange={setCode} onRun={handleRun} />
              <OutputSection
                output={output}
                input={input}
                onInputChange={setInput}
                isRunning={execLoading}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onClear={() => setOutput([])}
                showSubmit
                state={execState}
                onInputSubmit={handleInputSubmit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};