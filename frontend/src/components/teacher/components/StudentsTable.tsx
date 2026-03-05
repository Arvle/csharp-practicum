import React from 'react';
import { StudentWithStats } from '../../../api/types';
import { TableRow } from './TableRow';

interface StudentsTableProps {
    students: StudentWithStats[];
    assignments: any[];
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
    return (
        <div className="table-container">
            <table className="students-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Last Attempt</th>
                        <th>Grade</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="empty-table">
                                <i className="fas fa-users"></i>
                                <p>No data</p>
                            </td>
                        </tr>
                    ) : (
                        students.map(student => {
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
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};