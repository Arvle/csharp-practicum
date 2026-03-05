import React from 'react';
import { useTeacherData } from './hooks/useTeacherData';
import { useGrading } from './hooks/useGrading';
import { useNotifications } from '../../components/common/notifications/useNotifications';
import { UserMenu } from '../../components/common/UserMenu';
import { StatsGrid } from './components/StatsGrid';
import { StudentsTable } from './components/StudentsTable';
import { SubmissionModal } from './modals/SubmissionModal';
import { loadMessages } from '../../config/loader';
import '../../styles/teacher.css';

export const TeacherView: React.FC = () => {
  const { notifications } = useNotifications();
  const messages = loadMessages('ru');
  
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
  } = useGrading(students, setStudents, submissions, setSubmissions, messages);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <i className="fas fa-spinner fa-spin"></i>
          <p>{messages.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-layout">
      {notifications.map(n => (
        <div key={n.id} className={`notification ${n.type}`}>
          <i className={`fas fa-${
            n.type === 'success' ? 'check-circle' :
            n.type === 'error' ? 'exclamation-circle' : 'info-circle'
          }`}></i>
          {n.message}
        </div>
      ))}

      <div className="teacher-sidebar">
        <div className="sidebar-header">
          <h2>
            <i className="fas fa-chalkboard-teacher"></i>
            {messages.teacher.dashboard}
          </h2>
          <span className="group-badge">{group}</span>
        </div>

        <div className="sidebar-content">
          <div className="students-list">
            {students.map(student => (
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
                  {student.grade && (
                    <span className="student-grade">{student.grade}</span>
                  )}
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
              {messages.teacher.dashboard}
            </h1>
            <input 
              type="text"
              className="group-input"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder={messages.auth.group}
            />
          </div>
          <UserMenu />
        </div>

        <div className="teacher-content">
          <StatsGrid stats={stats} messages={messages} />

          <StudentsTable
            students={students}
            assignments={assignments}
            getStatusClass={getStatusClass}
            getStatusText={getStatusText}
            onViewStudent={(student) => console.log('View student:', student)}
            onGradeStudent={openGrading}
            messages={messages}
          />

          <div className="copyright">
            © {messages.app.name}
          </div>
        </div>
      </div>

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
        messages={messages}
      />
    </div>
  );
};