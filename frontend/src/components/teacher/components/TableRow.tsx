import React from 'react';
import { StudentWithStats } from '../../../api/types';

interface TableRowProps {
    student: StudentWithStats;
    assignment: any;
    getStatusClass: (status: string) => string;
    getStatusText: (status: string) => string;
    onView: () => void;
    onGrade: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
    student,
    assignment,
    getStatusClass,
    getStatusText,
    onView,
    onGrade
}) => {
    return (
        <tr>
            <td>{student.name}</td>
            <td>{student.studentId}</td>
            <td>
                <span className={`status-badge ${getStatusClass(student.status)}`}>
                    {getStatusText(student.status)}
                </span>
            </td>
            <td>
                {assignment ? (
                    <>
                        <div>{assignment.title}</div>
                        <small>{new Date(student.lastSubmission?.submittedAt || '').toLocaleString()}</small>
                    </>
                ) : '—'}
            </td>
            <td className="grade">{student.grade || '—'}</td>
            <td>
                <div className="action-buttons">
                    <button className="action-btn" onClick={onView} title="View details">
                        <i className="fas fa-eye"></i>
                    </button>
                    <button className="action-btn primary" onClick={onGrade} title="Grade submission">
                        <i className="fas fa-star"></i>
                    </button>
                </div>
            </td>
        </tr>
    );
};