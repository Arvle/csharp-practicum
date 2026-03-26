import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../hooks/useStudentData';
import { useCodeExecution } from '../../hooks/useCodeExecution';
import { useNotifications, Notification } from '../common/hooks/useNotifications';
import { UserMenu } from '../common/UserMenu';
import { StudentSidebar } from './components/StudentSidebar';
import { EditorSection } from './components/EditorSection';
import { OutputSection } from './components/OutputSection';
import { useTranslation } from '../../locales';

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
    selectAssignment
  } = useStudentData();

  const {
    code,
    setCode,
    output,
    setOutput,
    loading: execLoading,
    handleRun,
    handleSubmit,
    handleReset
  } = useCodeExecution(selectedId, user?.id || 0, refreshSubmissions);

  useEffect(() => {
    if (currentAssignment) {
      handleReset(currentAssignment.initialCode);
    }
  }, [currentAssignment, handleReset]);

  if (dataLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <i className="fas fa-spinner fa-spin"></i>
          <p>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-layout">
      {notifications.map((n: Notification) => ( 
        <div key={n.id} className={`notification ${n.type}`}>
          <i className={`fas fa-${
            n.type === 'success' ? 'check-circle' :
            n.type === 'error' ? 'exclamation-circle' : 'info-circle'
          }`}></i>
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
        {currentAssignment && (
          <>
            <div className="editor-header">
              <div className="editor-info">
                <h2>
                  <i className="fas fa-tasks"></i>
                  {currentAssignment.title}
                </h2>
                <p>{currentAssignment.description}</p>
              </div>
              <div className="editor-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleReset(currentAssignment.initialCode)}
                >
                  <i className="fas fa-undo"></i>
                  {t.editor.reset}
                </button>
                <UserMenu />
              </div>
            </div>

            <div className="editor-container">
              <EditorSection
                code={code}
                onChange={setCode}
              />

              <OutputSection
                output={output}
                loading={execLoading}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onClear={() => setOutput([])}
                showSubmit={true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};