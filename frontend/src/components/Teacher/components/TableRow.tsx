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
            <td>
                <strong>{student.name}</strong>
            </td>
            <td>{student.studentId}</td>
            <td>
                <span className={`status-badge ${getStatusClass(student.status)}`}>
                    {getStatusText(student.status)}
                </span>
            </td>
            <td>
                {student.lastSubmission ? (
                    <>
                        {new Date(student.lastSubmission.submittedAt).toLocaleDateString()}
                        <br />
                        <small>{assignment?.title}</small>
                    </>
                ) : (
                    <span style={{ color: '#95a5a6' }}>Нет попыток</span>
                )}
            </td>
            <td>
                {student.grade ? (
                    <strong className="grade">{student.grade}</strong>
                ) : (
                    <span style={{ color: '#95a5a6' }}>—</span>
                )}
            </td>
            <td>
                <div className="action-buttons">
                    <button className="action-btn" onClick={onView}>
                        <i className="fas fa-eye"></i>
                        Просмотр
                    </button>
                    {student.lastSubmission && (
                        <button className="action-btn primary" onClick={onGrade}>
                            <i className="fas fa-star"></i>
                            Оценить
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};