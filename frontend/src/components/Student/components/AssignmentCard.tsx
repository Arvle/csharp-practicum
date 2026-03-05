import React from 'react';
import { Assignment } from '../../../api/types';

interface AssignmentCardProps {
    assignment: Assignment;
    status: 'pending' | 'done' | 'incorrect';
    statusText: string;
    isSelected: boolean;
    onSelect: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
    assignment,
    status,
    statusText,
    isSelected,
    onSelect
}) => {
    return (
        <div
            className={`assignment-card ${status === 'done' ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="assignment-header">
                <div className="assignment-title">{assignment.title}</div>
                <span className={`assignment-status status-${status}`}>
                    {status === 'done' ? '✓ Сдано' : 
                     status === 'incorrect' ? '✗ Ошибка' : '⏳ Ожидает'}
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