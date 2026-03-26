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
  
  const getStatusClass = () => {
    switch(status) {
      case 'done': return 'status-done';
      case 'incorrect': return 'status-incorrect';
      default: return 'status-pending';
    }
  };
  
  const getStatusText = () => {
    switch(status) {
      case 'done': return t.student.status.done;
      case 'incorrect': return t.student.status.incorrect;
      default: return t.student.status.pending;
    }
  };

  return (
    <div
      className={`assignment-card ${status === 'done' ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="assignment-header">
        <div className="assignment-title">{assignment.title}</div>
        <span className={`assignment-status ${getStatusClass()}`}>
          {getStatusText()}
        </span>
      </div>
      <div className="assignment-description">
        {assignment.description}
      </div>
      <div className="assignment-footer">
        <span>
          <i className="far fa-calendar"></i>
          {new Date(assignment.createdAt).toLocaleDateString()}
        </span>
        <span>
          <i className="fas fa-code"></i>
          C#
        </span>
      </div>
    </div>
  );
};