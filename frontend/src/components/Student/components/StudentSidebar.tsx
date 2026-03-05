import React from 'react';
import { Assignment } from '../../../api/types';
import { AssignmentCard } from './AssignmentCard';

interface StudentSidebarProps {
    assignments: Assignment[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    getStatus: (id: number) => 'pending' | 'done' | 'incorrect';
    getStatusText: (status: string) => string;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
    assignments,
    selectedId,
    onSelect,
    getStatus,
    getStatusText
}) => {
    return (
        <div className="student-sidebar">
            <div className="sidebar-header">
                <h2>
                    <i className="fas fa-code"></i>
                    C# Практикум
                </h2>
                <p>Студент: Иванов Иван</p>
            </div>
            
            <div className="sidebar-tabs">
                <button className="sidebar-tab active">
                    <i className="fas fa-tasks"></i>
                    Задания
                    {assignments.length > 0 && (
                        <span className="badge">{assignments.length}</span>
                    )}
                </button>
            </div>

            <div className="sidebar-content">
                <div className="assignments-list">
                    {assignments.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-tasks"></i>
                            <p>Нет доступных заданий</p>
                        </div>
                    ) : (
                        assignments.map(assignment => {
                            const status = getStatus(assignment.id);
                            return (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    status={status}
                                    statusText={getStatusText(status)}
                                    isSelected={selectedId === assignment.id}
                                    onSelect={() => onSelect(assignment.id)}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};