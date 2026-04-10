import React from 'react';
import { Assignment } from '../../../api/types';
import { AssignmentCard } from './AssignmentCard';
import { useTranslation } from '../../../locales';

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
    const { t } = useTranslation();

    return (
        <aside className="student-sidebar" aria-label={t.student.dashboard}>
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <i className="fas fa-terminal" aria-hidden />
                </div>
                <div className="sidebar-brand-text">
                    <h2>{t.app.name}</h2>
                    <p>{t.student.dashboard}</p>
                </div>
            </div>

            <div className="sidebar-section-header">
                <span>
                    <i className="fas fa-tasks" aria-hidden />
                    {t.student.assignments}
                </span>
                {assignments.length > 0 && (
                    <span className="sidebar-count">{assignments.length}</span>
                )}
            </div>

            <div className="sidebar-content">
                <div className="assignments-list">
                    {assignments.length === 0 ? (
                        <div className="sidebar-empty">
                            <i className="fas fa-inbox" aria-hidden />
                            <p>{t.student.noAssignments}</p>
                        </div>
                    ) : (
                        assignments.map(assignment => {
                            const status = getStatus(assignment.id);
                            return (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    status={status}
                                    isSelected={selectedId === assignment.id}
                                    onSelect={() => onSelect(assignment.id)}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </aside>
    );
};
