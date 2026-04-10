import React from 'react';
import { Assignment } from '../../../api/types';
import { useTranslation } from '../../../locales';

interface AssignmentCardProps {
  assignment: Assignment;
  status: 'pending' | 'done' | 'incorrect';
  isSelected: boolean;
  onSelect: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  status,
  isSelected,
  onSelect
}) => {
  const { t } = useTranslation();

  const statusConfig = {
    done: { class: 'status-done', label: t.student.status.done, icon: 'fa-check-circle' },
    incorrect: { class: 'status-incorrect', label: t.student.status.incorrect, icon: 'fa-times-circle' },
    pending: { class: 'status-pending', label: t.student.status.pending, icon: 'fa-clock' }
  };

  const { class: statusClass, label, icon } = statusConfig[status];

  return (
    <div
      className={`assignment-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(); }}
    >
      <div className="assignment-card-accent" />
      <div className="assignment-card-body">
        <div className="assignment-card-top">
          <h3 className="assignment-card-title">{assignment.title}</h3>
          <span className={`assignment-status-badge ${statusClass}`}>
            <i className={`fas ${icon}`} aria-hidden />
            {label}
          </span>
        </div>
        <p className="assignment-card-desc">{assignment.description}</p>
        <div className="assignment-card-meta">
          <time dateTime={assignment.createdAt}>
            <i className="far fa-calendar" aria-hidden />
            {new Date(assignment.createdAt).toLocaleDateString()}
          </time>
        </div>
      </div>
    </div>
  );
};
