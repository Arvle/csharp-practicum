import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from './hooks/useStudentData';
import { useCodeExecution } from './hooks/useCodeExecution';
import { useNotifications } from '../../components/common/notifications/useNotifications';
import { UserMenu } from '../../components/common/UserMenu';
import { StudentSidebar } from './components/StudentSidebar';
import { EditorSection } from './components/EditorSection';
import { OutputSection } from './components/OutputSection';
import { loadMessages } from '../../config/loader';
import '../../styles/student.css';

export const StudentView: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const messages = loadMessages('ru');
  
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
  }, [currentAssignment]);

  if (dataLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <i className="fas fa-spinner fa-spin"></i>
          <p>{messages.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-layout">
      {notifications.map(n => (
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
        messages={messages}
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
                  {messages.student.reset_code}
                </button>
                <UserMenu />
              </div>
            </div>

            <div className="editor-container">
              <EditorSection
                code={code}
                onChange={setCode}
                messages={messages}
              />

              <OutputSection
                output={output}
                loading={execLoading}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onClear={() => setOutput([])}
                showSubmit={true}
                messages={messages}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};