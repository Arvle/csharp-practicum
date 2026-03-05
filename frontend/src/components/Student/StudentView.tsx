import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from './hooks/useStudentData';
import { useCodeExecution } from './hooks/useCodeExecution';
import { useNotifications } from '../common/hooks/useNotifications';
import { StudentSidebar } from './components/StudentSidebar';
import { EditorSection } from './components/EditorSection';
import { OutputSection } from './components/OutputSection';
import { NewProjectModal } from './modals/NewProjectModal';
import "../../styles/student.css";

export const StudentView: React.FC = () => {
    const { user } = useAuth();
    const { notifications } = useNotifications();
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
    } = useCodeExecution(selectedId, user?.id || 1, refreshSubmissions);

    const [projects, setProjects] = useState<any[]>([]);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    useEffect(() => {
        if (currentAssignment) {
            handleReset(currentAssignment.initialCode);
        }
    }, [currentAssignment]);

    if (dataLoading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="student-layout">
            {/* Уведомления */}
            {notifications.map(n => (
                <div key={n.id} className={`notification ${n.type}`}>
                    <i className={`fas fa-${
                        n.type === 'success' ? 'check-circle' :
                        n.type === 'error' ? 'exclamation-circle' : 'info-circle'
                    }`}></i>
                    {n.message}
                </div>
            ))}

            {/* Левая панель */}
            <StudentSidebar
                assignments={assignments}
                selectedId={selectedId}
                onSelect={selectAssignment}
                getStatus={getAssignmentStatus}
                getStatusText={getStatusText}
            />

            {/* Основная область */}
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
                                    Сброс
                                </button>
                            </div>
                        </div>

                        <div className="editor-container">
                            <EditorSection
                                code={code}
                                onChange={setCode}
                                title={currentAssignment.title}
                                description={currentAssignment.description}
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

            {/* Модальное окно создания проекта - пока не используется, но оставим */}
            <NewProjectModal
                isOpen={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
                onSave={() => {}}
                initialCode={code}
            />
        </div>
    );
};