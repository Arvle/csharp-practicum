import React from 'react';
import { StudentWithStats } from '../../../api/types';
import { useTranslation } from '../../../locales';

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
  const { t } = useTranslation();
  const canGrade = !!student.lastSubmission;

  return (
    <tr>
      <td className="student-name-cell">{student.name}</td>
      <td className="student-id-cell">{student.studentId}</td>
      <td>
        <span className={`status-badge ${getStatusClass(student.status)}`}>
          {getStatusText(student.status)}
        </span>
      </td>
      <td>
        {assignment ? (
          <>
            <div>{assignment.title}</div>
            <small>
              {student.lastSubmission?.submittedAt 
                ? new Date(student.lastSubmission.submittedAt).toLocaleString() 
                : '—'}
            </small>
          </>
        ) : '—'}
      </td>
      <td className="grade-cell">{student.grade || '—'}</td>
      <td className="actions-cell">
        <div className="action-buttons">
          <button type="button" className="action-btn" onClick={onView} title={t.common.view}>
            <i className="fas fa-eye"></i>
          </button>
          <button
            type="button"
            className="action-btn primary"
            onClick={onGrade}
            disabled={!canGrade}
            title={t.teacher.grading.title}
          >
            <i className="fas fa-star"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};