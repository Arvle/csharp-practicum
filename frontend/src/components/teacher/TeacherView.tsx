import React, { useState, useEffect } from 'react';
import { useTeacherData } from '../../hooks/useTeacherData';
import { useGrading } from './hooks/useGrading';
import { useNotifications, Notification } from '../common/hooks/useNotifications';
import { UserMenu } from '../common/UserMenu';
import { StatsGrid } from './components/StatsGrid';
import { StudentsTable } from './components/StudentsTable';
import { SubmissionModal } from './modals/SubmissionModal';
import { useTranslation } from '../../locales';

export const TeacherView: React.FC = () => {
  const { notifications } = useNotifications();
  const { t } = useTranslation();

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
    getStatusClass,
    refreshData,
  } = useTeacherData();

  const {
    selectedSubmission,
    grade,
    comment,
    setGrade,
    setComment,
    handleGradeSubmit,
    openGrading,
    closeGrading,
    isSubmitting,
  } = useGrading(students, setStudents, submissions, setSubmissions);

  const [selectedStudentForView, setSelectedStudentForView] = useState<any>(null);

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <i className="fas fa-spinner fa-spin"></i>
          <p>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-layout">
      {notifications.map((n: Notification) => (
        <div key={n.id} className={`notification ${n.type}`}>
          <i
            className={`fas fa-${
              n.type === 'success'
                ? 'check-circle'
                : n.type === 'error'
                ? 'exclamation-circle'
                : 'info-circle'
            }`}
          ></i>
          {n.message}
        </div>
      ))}

      <div className="teacher-sidebar">
        <div className="sidebar-header">
          <h2>
            <i className="fas fa-chalkboard-teacher"></i>
            {t.teacher.dashboard}
          </h2>
          {group && <span className="group-badge">{group}</span>}
        </div>

        <div className="sidebar-tabs">
          <button className="sidebar-tab active">
            <i className="fas fa-users"></i>
            {t.teacher.students}
            {students.length > 0 && <span className="badge">{students.length}</span>}
          </button>
        </div>

        <div className="sidebar-content">
          <div className="students-list">
            {students.map((student: any) => (
              <div key={student.id} className="student-card">
                <div className="student-card-header">
                  <span className="student-name">{student.name}</span>
                  <span className="student-id">{student.studentId}</span>
                </div>
                <div className="student-info">
                  <div className="student-info-item">
                    <i className="fas fa-users"></i>
                    {student.group}
                  </div>
                </div>
                <div className="student-status">
                  <span className={`status-badge ${getStatusClass(student.status)}`}>
                    {getStatusText(student.status)}
                  </span>
                  {student.grade && <span className="student-grade">{student.grade}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="teacher-main">
        <div className="teacher-header">
          <div className="header-left">
            <h1>
              <i className="fas fa-chart-line"></i>
              {t.teacher.dashboard}
            </h1>
            <input
              type="text"
              className="group-input"
              value={group}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroup(e.target.value)}
              placeholder={t.auth.student.group}
            />
          </div>
          <UserMenu />
        </div>

        <div className="teacher-content">
          <StatsGrid stats={stats} />

          <div className="students-table-container">
            <StudentsTable
              students={students}
              assignments={assignments}
              getStatusClass={getStatusClass}
              getStatusText={getStatusText}
              onViewStudent={setSelectedStudentForView}
              onGradeStudent={openGrading}
            />
          </div>

          <div className="copyright">© {t.app.name}</div>
        </div>
      </div>

      <SubmissionModal
        isOpen={!!selectedSubmission}
        onClose={closeGrading}
        submission={selectedSubmission}
        assignment={
          selectedSubmission
            ? assignments.find((a: any) => a.id === selectedSubmission.assignmentId)
            : undefined
        }
        grade={grade}
        comment={comment}
        onGradeChange={setGrade}
        onCommentChange={setComment}
        onSave={handleGradeSubmit}
      />
    </div>
  );
};