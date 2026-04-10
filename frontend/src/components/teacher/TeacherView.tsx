import React, { useState } from 'react';
import { useTeacherData } from '../../hooks/useTeacherData';
import { useGrading } from './hooks/useGrading';
import { useNotifications, Notification } from '../common/hooks/useNotifications';
import { UserMenu } from '../common/UserMenu';
import { StatsGrid } from './components/StatsGrid';
import { StudentsTable } from './components/StudentsTable';
import { SubmissionModal } from './modals/SubmissionModal';
import { StudentWorkModal } from './modals/StudentWorkModal';
import { AssignmentsPanel } from './AssignmentsPanel';
import { useTranslation } from '../../locales';
import { Submission, StudentWithStats } from '../../api/types';

type MainTab = 'overview' | 'assignments';

export const TeacherView: React.FC = () => {
  const { notifications } = useNotifications();
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [viewStudent, setViewStudent] = useState<StudentWithStats | null>(null);

  const {
    students,
    setStudents,
    submissions,
    setSubmissions,
    assignments,
    loading,
    group,
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

  const handleGradeFromWorks = (sub: Submission) => {
    if (!viewStudent) return;
    const st = viewStudent;
    setViewStudent(null);
    openGrading(st, sub);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <i className="fas fa-spinner fa-spin" aria-hidden />
          <p>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-layout">
      {notifications.map((n: Notification) => (
        <div key={n.id} className={`notification ${n.type}`} role="status">
          <i
            className={`fas fa-${
              n.type === 'success'
                ? 'check-circle'
                : n.type === 'error'
                  ? 'exclamation-circle'
                  : 'info-circle'
            }`}
            aria-hidden
          />
          {n.message}
        </div>
      ))}

      <aside className="teacher-sidebar" aria-label={t.teacher.dashboard}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon purple">
            <i className="fas fa-chalkboard-teacher" aria-hidden />
          </div>
          <div className="sidebar-brand-text">
            <h2>{t.app.name}</h2>
            <p>{t.teacher.dashboard}</p>
          </div>
        </div>

        {group.trim() && (
          <div className="sidebar-chip">
            <i className="fas fa-users" aria-hidden />
            {group.trim()}
          </div>
        )}

        <div className="sidebar-section-header">
          <span>
            <i className="fas fa-user-graduate" aria-hidden />
            {t.teacher.students}
          </span>
          {students.length > 0 && (
            <span className="sidebar-count">{students.length}</span>
          )}
        </div>

        <div className="sidebar-content">
          <div className="students-list">
            {students.length === 0 ? (
              <div className="sidebar-empty">
                <i className="fas fa-user-slash" aria-hidden />
                <p>{t.teacher.sidebarEmpty}</p>
              </div>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="student-mini-card"
                  onClick={() => setViewStudent(student)}
                >
                  <div className="student-mini-top">
                    <span className="student-mini-name">{student.name}</span>
                    <span className="student-mini-id">{student.studentId}</span>
                  </div>
                  <div className="student-mini-bottom">
                    <span className={`status-dot ${getStatusClass(student.status)}`} />
                    {student.grade != null ? (
                      <span className="mini-grade">{student.grade}</span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <div className="teacher-main">
        {/* Top bar */}
        <header className="teacher-topbar">
          <div className="teacher-topbar-left">
            <h1>
              <i className="fas fa-chart-line" aria-hidden />
              {t.teacher.dashboard}
            </h1>
          </div>
          <div className="teacher-topbar-right">
            <UserMenu />
          </div>
        </header>

        {/* Tabs */}
        <nav className="teacher-tabs" aria-label={t.common.actions}>
          <button
            type="button"
            className={`teacher-tab ${mainTab === 'overview' ? 'active' : ''}`}
            onClick={() => setMainTab('overview')}
          >
            <i className="fas fa-table" aria-hidden />
            {t.teacher.mainTabOverview}
          </button>
          <button
            type="button"
            className={`teacher-tab ${mainTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setMainTab('assignments')}
          >
            <i className="fas fa-tasks" aria-hidden />
            {t.teacher.mainTabAssignments}
            {assignments.length > 0 ? (
              <span className="sidebar-count">{assignments.length}</span>
            ) : null}
          </button>
        </nav>

        {/* Content */}
        <div className="teacher-content">
          {mainTab === 'overview' ? (
            <>
              <StatsGrid stats={stats} />
              <div className="students-table-container">
                <StudentsTable
                  students={students}
                  assignments={assignments}
                  getStatusClass={getStatusClass}
                  getStatusText={getStatusText}
                  onViewStudent={setViewStudent}
                  onGradeStudent={openGrading}
                />
              </div>
            </>
          ) : (
            <AssignmentsPanel assignments={assignments} onChanged={refreshData} />
          )}
        </div>
      </div>

      <StudentWorkModal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        student={viewStudent}
        assignments={assignments}
        onGradeSubmission={handleGradeFromWorks}
      />

      <SubmissionModal
        isOpen={!!selectedSubmission}
        onClose={closeGrading}
        submission={selectedSubmission}
        assignment={
          selectedSubmission
            ? assignments.find((a) => a.id === selectedSubmission.assignmentId)
            : undefined
        }
        grade={grade}
        comment={comment}
        onGradeChange={setGrade}
        onCommentChange={setComment}
        onSave={handleGradeSubmit}
        busy={isSubmitting}
      />
    </div>
  );
};
