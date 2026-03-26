import React from 'react';
import { StudentWithStats, Assignment } from '../../../api/types';
import { TableRow } from './TableRow';
import { useTranslation } from '../../../locales';

interface StudentsTableProps {
  students: StudentWithStats[];
  assignments: Assignment[];
  getStatusClass: (status: string) => string;
  getStatusText: (status: string) => string;
  onViewStudent: (student: StudentWithStats) => void;
  onGradeStudent: (student: StudentWithStats, submission: any) => void;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  assignments,
  getStatusClass,
  getStatusText,
  onViewStudent,
  onGradeStudent
}) => {
  const { t } = useTranslation();

  if (students.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-users"></i>
        <p>{t.teacher.empty}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="students-table">
        <thead>
          <tr>
            <th>{t.teacher.table.student}</th>
            <th>{t.teacher.table.studentId}</th>
            <th>{t.teacher.table.status}</th>
            <th>{t.teacher.table.lastAttempt}</th>
            <th>{t.teacher.table.grade}</th>
            <th>{t.teacher.table.actions}</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => {
            const lastSub = student.lastSubmission;
            const assignment = lastSub 
              ? assignments.find(a => a.id === lastSub.assignmentId) 
              : null;
            
            return (
              <TableRow
                key={student.id}
                student={student}
                assignment={assignment}
                getStatusClass={getStatusClass}
                getStatusText={getStatusText}
                onView={() => onViewStudent(student)}
                onGrade={() => lastSub && onGradeStudent(student, lastSub)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};