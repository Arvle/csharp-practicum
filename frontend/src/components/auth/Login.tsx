import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../locales';
import { DEFAULT_GROUPS } from '../../config/constants';

type LoginMode = 'student' | 'teacher';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>('student');
  const { login, isLoading, error } = useAuth();
  const { t } = useTranslation();

  const [studentId, setStudentId] = useState('');
  const [group, setGroup] = useState(DEFAULT_GROUPS[0]);
  const [accessCode, setAccessCode] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear local error when switching modes
  useEffect(() => {
    setLocalError('');
  }, [mode]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!studentId.trim()) {
      setLocalError(t.auth.errors.studentIdRequired);
      return;
    }
    const success = await login({ studentId }, 'student');
    if (!success) {
      setLocalError(t.auth.errors.loginFailed);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!accessCode.trim()) {
      setLocalError(t.auth.errors.accessCodeRequired);
      return;
    }
    if (!group) {
      setLocalError(t.auth.errors.groupRequired);
      return;
    }

    const success = await login({ accessCode, group }, 'teacher');
    if (!success) {
      setLocalError(t.auth.errors.invalidAccessCode);
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">
              <i className="fas fa-terminal" aria-hidden />
            </span>
          </div>
          <h1 className="login-title">{t.app.name}</h1>
          <p className="login-subtitle">
            {mode === 'student' ? t.auth.student.subtitle : t.auth.teacher.subtitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'student' ? 'active' : ''}`}
            onClick={() => setMode('student')}
            type="button"
          >
            <i className="fas fa-user-graduate" aria-hidden />
            <span>{t.auth.student.tabLabel}</span>
          </button>
          <button
            className={`login-tab ${mode === 'teacher' ? 'active' : ''}`}
            onClick={() => setMode('teacher')}
            type="button"
          >
            <i className="fas fa-chalkboard-teacher" aria-hidden />
            <span>{t.auth.teacher.tabLabel}</span>
          </button>
        </div>

        {/* Student Form */}
        {mode === 'student' && (
          <form onSubmit={handleStudentLogin} className="login-form" noValidate>
            <div className="form-field">
              <label htmlFor="studentId" className="form-label">
                {t.auth.student.studentId}
              </label>
              <div className="input-wrapper">
                <i className="fas fa-id-card input-icon" aria-hidden />
                <input
                  id="studentId"
                  type="text"
                  className="form-input"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder={t.auth.student.studentIdPlaceholder}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {displayError && (
              <div className="alert alert-error" role="alert">
                <i className="fas fa-exclamation-triangle" aria-hidden />
                <span>{displayError}</span>
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  {t.auth.student.login}
                  <i className="fas fa-arrow-right" aria-hidden />
                </>
              )}
            </button>
          </form>
        )}

        {/* Teacher Form */}
        {mode === 'teacher' && (
          <form onSubmit={handleTeacherLogin} className="login-form" noValidate>
            <div className="form-field">
              <label htmlFor="accessCode" className="form-label">
                {t.auth.teacher.accessCode}
              </label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon" aria-hidden />
                <input
                  id="accessCode"
                  type="password"
                  className="form-input"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder={t.auth.teacher.accessCodePlaceholder}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="group" className="form-label">
                {t.auth.teacher.group}
              </label>
              <div className="input-wrapper">
                <i className="fas fa-users input-icon" aria-hidden />
                <select
                  id="group"
                  className="form-input form-select"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  disabled={isLoading}
                >
                  {DEFAULT_GROUPS.map((g: string) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {displayError && (
              <div className="alert alert-error" role="alert">
                <i className="fas fa-exclamation-triangle" aria-hidden />
                <span>{displayError}</span>
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  {t.auth.teacher.login}
                  <i className="fas fa-arrow-right" aria-hidden />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          {mode === 'student' ? (
            <button
              type="button"
              className="switch-mode-btn"
              onClick={() => setMode('teacher')}
            >
              <i className="fas fa-chalkboard-teacher" aria-hidden />
              <span>{t.auth.student.switchToTeacher}</span>
            </button>
          ) : (
            <button
              type="button"
              className="switch-mode-btn"
              onClick={() => setMode('student')}
            >
              <i className="fas fa-user-graduate" aria-hidden />
              <span>{t.auth.teacher.switchToStudent}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};