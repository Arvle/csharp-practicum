import React, { useState, useCallback } from 'react';
import { useTeacherData } from '../../hooks/useTeacherData';
import { useNotifications, Notification } from '../common/hooks/useNotifications';
import { UserMenu } from '../common/UserMenu';
import { Modal } from '../common/modal/Modal';
import { StatsGrid } from './components/StatsGrid';
import { SubmissionModal } from './modals/SubmissionModal';
import { AssignmentsPanel } from './AssignmentsPanel';
import { useTranslation } from '../../locales';
import { Submission } from '../../api/types';
import { sessionsApi } from '../../api/sessions';
import { submissionsApi } from '../../api/submissions';

type MainTab = 'overview' | 'assignments';

export const TeacherView: React.FC = () => {
  const { notifications } = useNotifications();
  const { t } = useTranslation();
  const { 
    sessions, 
    selectedSessionId, 
    setSelectedSessionId, 
    assignments, 
    submissions, 
    studentProgress,
    loading, 
    error, 
    stats, 
    refresh 
  } = useTeacherData();
  
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [creatingSession, setCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    studentId: number;
    assignmentId: number;
    submissions: Submission[];
  }>({ open: false, studentId: 0, assignmentId: 0, submissions: [] });

  const activeSession = sessions.find(s => s.id === selectedSessionId) || null;
  const inviteLink = activeSession
    ? `${window.location.origin}/join/${activeSession.inviteToken}`
    : '';

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);
    if (!newSessionTitle.trim()) {
      setSessionError('Укажите название урока');
      return;
    }
    setCreatingSession(true);
    try {
      const s = await sessionsApi.create({ title: newSessionTitle.trim() });
      setSelectedSessionId(s.id);
      setNewSessionTitle('');
      refresh();
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleCopyLink = useCallback(() => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('Ссылка скопирована в буфер обмена');
    });
  }, [inviteLink]);

  const openGrading = useCallback((sub: Submission) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade || 5);
    setComment(sub.teacherComment || '');
  }, []);

  const closeGrading = useCallback(() => {
    setSelectedSubmission(null);
    setGrade(5);
    setComment('');
  }, []);

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    setIsSubmittingGrade(true);
    try {
      await submissionsApi.grade(selectedSubmission.id, grade, comment);
      closeGrading();
      refresh();
    } catch (err) {
      alert('Ошибка сохранения оценки');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const openHistoryModal = useCallback((studentId: number, assignmentId: number) => {
    const allSubs = submissions.filter(
      s => s.userId === studentId && s.assignmentId === assignmentId
    ).sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    setHistoryModal({
      open: true,
      studentId,
      assignmentId,
      submissions: allSubs,
    });
  }, [submissions]);

  const closeHistoryModal = useCallback(() => {
    setHistoryModal(prev => ({ ...prev, open: false }));
  }, []);

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
          <i className={`fas fa-${n.type === 'success' ? 'check-circle' : n.type === 'error' ? 'exclamation-circle' : 'info-circle'}`} aria-hidden />
          {n.message}
        </div>
      ))}
      
      <aside className="teacher-sidebar" aria-label="Панель сессий">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon purple">
            <i className="fas fa-chalkboard-teacher" aria-hidden />
          </div>
          <div className="sidebar-brand-text">
            <h2>{t.app.name}</h2>
            <p>Управление уроками</p>
          </div>
        </div>

        <div className="sidebar-section-header">
          <span><i className="fas fa-layer-group" aria-hidden /> Ваши уроки</span>
          {sessions.length > 0 && <span className="sidebar-count">{sessions.length}</span>}
        </div>

        <div className="sidebar-content">
          <div className="students-list">
            {sessions.map(session => (
              <button
                key={session.id}
                type="button"
                className={`student-mini-card ${session.id === selectedSessionId ? 'selected' : ''}`}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <div className="student-mini-top">
                  <span className="student-mini-name">{session.title}</span>
                  <span className={`status-dot ${session.isActive ? 'status-done' : 'status-incorrect'}`} />
                </div>
                <div className="student-mini-bottom">
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                    {new Date(session.startsAt).toLocaleDateString()}
                  </small>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateSession} className="create-form-card" style={{ marginTop: '1rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Новый урок..."
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              disabled={creatingSession}
            />
            {sessionError && <div className="alert alert-error" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{sessionError}</div>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={creatingSession}>
              {creatingSession ? 'Создание...' : '+ Создать урок'}
            </button>
          </form>
        </div>
      </aside>

      <div className="teacher-main">
        <header className="teacher-topbar">
          <div className="teacher-topbar-left">
            <h1>
              <i className="fas fa-chart-line" aria-hidden />
              {activeSession ? activeSession.title : 'Выберите урок'}
            </h1>
          </div>
          <div className="teacher-topbar-right">
            {activeSession && (
              <>
                <button className="btn btn-ghost" onClick={handleCopyLink} title="Скопировать ссылку для студентов">
                  <i className="fas fa-link" aria-hidden /> Ссылка для входа
                </button>
                <button className="btn btn-icon-danger" onClick={() => sessionsApi.revoke(activeSession.id).then(refresh)} title="Закрыть урок">
                  <i className="fas fa-ban" aria-hidden />
                </button>
              </>
            )}
            <UserMenu />
          </div>
        </header>

        {!activeSession ? (
          <div className="student-empty-main">
            <div className="empty-state">
              <div className="empty-state-icon"><i className="fas fa-inbox" aria-hidden /></div>
              <h2>Нет активных уроков</h2>
              <p>Создайте первый урок в боковой панели, чтобы начать работу.</p>
            </div>
          </div>
        ) : (
          <>
            <nav className="teacher-tabs" aria-label="Вкладки урока">
              <button 
                type="button" 
                className={`teacher-tab ${mainTab === 'overview' ? 'active' : ''}`} 
                onClick={() => setMainTab('overview')}
              >
                <i className="fas fa-table" aria-hidden /> Обзор
              </button>
              <button 
                type="button" 
                className={`teacher-tab ${mainTab === 'assignments' ? 'active' : ''}`} 
                onClick={() => setMainTab('assignments')}
              >
                <i className="fas fa-tasks" aria-hidden /> Задания
              </button>
            </nav>

            <div className="teacher-content">
              {mainTab === 'overview' && (
                <>
                  <StatsGrid stats={stats} />
                  
                  <div className="matrix-container">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Студент</th>
                          {assignments.map(a => (
                            <th key={a.id} className="assignment-col">{a.title}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {studentProgress.length === 0 ? (
                          <tr>
                            <td colSpan={assignments.length + 1} className="empty-state">
                              {stats.joined > 0 
                                ? 'Студенты зашли, но ещё не сдавали работы.' 
                                : 'Пока никто не перешёл по ссылке.'}
                            </td>
                          </tr>
                        ) : (
                          studentProgress.map(student => (
                            <tr key={student.id}>
                              <td className="student-name-cell">{student.name}</td>
                              {assignments.map(assignment => {
                                const latest = student.assignments.get(assignment.id);
                                return (
                                  <td 
                                    key={assignment.id} 
                                    className="matrix-cell"
                                    onClick={() => latest && openHistoryModal(student.id, assignment.id)}
                                    style={{ cursor: latest ? 'pointer' : 'default' }}
                                  >
                                    {latest ? (
                                      <>
                                        <span className={`status-badge status-${latest.status === 'done' ? 'done' : 'incorrect'}`}>
                                          {latest.status === 'done' ? '✓' : '✗'}
                                        </span>
                                        {latest.grade != null && (
                                          <span className="grade-badge">{latest.grade}</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="empty-cell">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {mainTab === 'assignments' && (
                <AssignmentsPanel 
                  assignments={assignments} 
                  onChanged={refresh} 
                  selectedSessionId={selectedSessionId}
                />
              )}
            </div>
          </>
        )}
      </div>

      {historyModal.open && (
        <Modal
          isOpen={historyModal.open}
          onClose={closeHistoryModal}
          title={`История попыток: ${studentProgress.find(s => s.id === historyModal.studentId)?.name}`}
          size="lg"
        >
          <div className="history-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {historyModal.submissions.length === 0 ? (
              <p>Нет попыток</p>
            ) : (
              historyModal.submissions.map((sub, idx) => (
                <div key={sub.id} className="history-item">
                  <div className="history-header">
                    <span className="history-attempt">Попытка #{historyModal.submissions.length - idx}</span>
                    <time>{new Date(sub.submittedAt).toLocaleString()}</time>
                    <span className={`status-badge status-${sub.status}`}>{sub.status}</span>
                  </div>
                  <pre className="code-preview">{sub.code}</pre>
                  <div className="result-preview">
                    <strong>Вывод:</strong>
                    <pre>{sub.output || '—'}</pre>
                  </div>
                  {sub.grade != null && (
                    <div className="grade-preview">
                      <strong>Оценка:</strong> {sub.grade}
                      {sub.teacherComment && <p>{sub.teacherComment}</p>}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      closeHistoryModal();
                      openGrading(sub);
                    }}
                  >
                    Оценить
                  </button>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      <SubmissionModal
        isOpen={!!selectedSubmission}
        onClose={closeGrading}
        submission={selectedSubmission}
        assignment={selectedSubmission ? assignments.find(a => a.id === selectedSubmission.assignmentId) : undefined}
        grade={grade}
        comment={comment}
        onGradeChange={setGrade}
        onCommentChange={setComment}
        onSave={handleSaveGrade}
        busy={isSubmittingGrade}
      />
    </div>
  );
};