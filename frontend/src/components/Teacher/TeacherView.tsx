import React, { useState } from 'react';
import { useTeacherData } from './hooks/useTeacherData';
import { useGrading } from './hooks/useGrading';
import { useNotifications } from '../common/hooks/useNotifications';
import { StatsGrid } from './components/StatsGrid';
import { StudentsTable } from './components/StudentsTable';
import { SubmissionModal } from './modals/SubmissionModal';
import "../../styles/teacher.css";

export const TeacherView: React.FC = () => {
    const { notifications } = useNotifications();
    const {
        students,
        setStudents,      
        submissions,
        setSubmissions, 
        assignments,
        loading,
        group,
        setGroup,
        stats,
        getStatusText,
        getStatusClass
    } = useTeacherData();

        const {
        selectedSubmission,
        grade,
        comment,
        setGrade,
        setComment,
        handleGradeSubmit,
        openGrading,
        closeGrading
    } = useGrading(students, setStudents, submissions, setSubmissions); 

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Загрузка данных...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-layout">
            {/* Уведомления */}
            {notifications.map(n => (
                <div key={n.id} className={`notification ${n.type}`}>
                    <i className={`fas fa-${
                        n.type === 'success' ? 'check-circle' :
                        n.type === 'error' ? 'exclamation-circle' : 'info-circle'
                    }`}></i>
                    {n.message}
                </div>
            ))}

            <div className="teacher-header">
                <div>
                    <h1>Панель преподавателя</h1>
                    <p>Группа: {group}</p>
                </div>
                <select 
                    className="group-select"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                >
                    <option>ИСП-211</option>
                    <option>ИСП-212</option>
                    <option>ИСП-213</option>
                </select>
            </div>

            <StatsGrid stats={stats} />

            <StudentsTable
                students={students}
                assignments={assignments}
                getStatusClass={getStatusClass}
                getStatusText={getStatusText}
                onViewStudent={(student) => console.log('View student:', student)}
                onGradeStudent={openGrading}
            />

            <SubmissionModal
                isOpen={!!selectedSubmission}
                onClose={closeGrading}
                submission={selectedSubmission}
                assignment={selectedSubmission ? assignments.find(a => a.id === selectedSubmission.assignmentId) : undefined}
                grade={grade}
                comment={comment}
                onGradeChange={setGrade}
                onCommentChange={setComment}
                onSave={handleGradeSubmit}
            />

            <div className="copyright">
                © Кос
            </div>
        </div>
    );
};