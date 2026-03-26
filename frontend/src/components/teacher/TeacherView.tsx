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
        <div className="sidebar-header">
          <h2>
            <i className="fas fa-chalkboard-teacher" aria-hidden />
            {t.app.name}
          </h2>
          <p className="sidebar-sub">{t.teacher.dashboard}</p>
          {group.trim() ? <span className="group-badge">{group.trim()}</span> : null}
        </div>

        <div className="sidebar-tabs" role="tablist">
          <button type="button" className="sidebar-tab active" role="tab" aria-selected>
            <i className="fas fa-users" aria-hidden />
            {t.teacher.students}
            {students.length > 0 ? <span className="badge">{students.length}</span> : null}
          </button>
        </div>

        <div className="sidebar-content">
          <div className="students-list">
            {students.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-user-slash" aria-hidden />
                <p>{t.teacher.sidebarEmpty}</p>
              </div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="student-card">
                  <div className="student-card-header">
                    <span className="student-name">{student.name}</span>
                    <span className="student-id">{student.studentId}</span>
                  </div>
                  <div className="student-info">
                    <div className="student-info-item">
                      <i className="fas fa-users" aria-hidden />
                      {student.group}
                    </div>
                  </div>
                  <div className="student-status">
                    <span className={`status-badge ${getStatusClass(student.status)}`}>
                      {getStatusText(student.status)}
                    </span>
                    {student.grade != null ? (
                      <span className="student-grade">{student.grade}</span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <div className="teacher-main">
        <header className="teacher-header">
          <div className="header-left">
            <h1>
              <i className="fas fa-chart-line" aria-hidden />
              {t.teacher.dashboard}
            </h1>
            <label className="sr-only" htmlFor="group-filter">
              {t.teacher.filterHint}
            </label>
            <input
              id="group-filter"
              type="search"
              className="group-input"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder={t.teacher.filterPlaceholder}
              autoComplete="off"
            />
          </div>
          <UserMenu />
        </header>

        <nav className="main-tabs" aria-label={t.common.actions}>
          <button
            type="button"
            className={`main-tab ${mainTab === 'overview' ? 'active' : ''}`}
            onClick={() => setMainTab('overview')}
          >
            <i className="fas fa-table" aria-hidden />
            {t.teacher.mainTabOverview}
          </button>
          <button
            type="button"
            className={`main-tab ${mainTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setMainTab('assignments')}
          >
            <i className="fas fa-tasks" aria-hidden />
            {t.teacher.mainTabAssignments}
            {assignments.length > 0 ? (
              <span className="badge badge-muted">{assignments.length}</span>
            ) : null}
          </button>
        </nav>

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

          <footer className="copyright">© {t.app.name}</footer>
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
