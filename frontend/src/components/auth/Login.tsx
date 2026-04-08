import { useState } from 'react';
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
      <div className="login-box">
        <div className="login-header">
          <i className="fas fa-code login-icon" aria-hidden />
          <h1>{t.app.name}</h1>
          <p className="login-tagline">{t.app.tagline}</p>
          <p className="login-mode-title">
            {mode === 'student' && t.auth.student.title}
            {mode === 'teacher' && t.auth.teacher.title}
          </p>
        </div>

        {(mode === 'student' || mode === 'teacher') && (
          <div className="login-features">
            <div className="login-features-col">
              <h3>{t.auth.featuresStudentsTitle}</h3>
              <ul>
                {t.auth.featuresStudent.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="login-features-col">
              <h3>{t.auth.featuresTeachersTitle}</h3>
              <ul>
                {t.auth.featuresTeacher.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="login-tabs">
          <button 
            className={`tab ${mode === 'student' ? 'active' : ''}`}
            onClick={() => setMode('student')}
            type="button"
          >
            <i className="fas fa-user-graduate"></i>
            {t.auth.student.title}
          </button>
          <button 
            className={`tab ${mode === 'teacher' ? 'active' : ''}`}
            onClick={() => setMode('teacher')}
            type="button"
          >
            <i className="fas fa-chalkboard-teacher"></i>
            {t.auth.teacher.title}
          </button>
        </div>

        {mode === 'student' && (
          <form onSubmit={handleStudentLogin} className="login-form">
            <div className="form-group">
              <label><i className="fas fa-id-card"></i>{t.auth.student.studentId}</label>
              <input
                type="text"
                className="login-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="12345"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            {displayError && (
              <div className="login-error">
                <i className="fas fa-exclamation-circle"></i>
                {displayError}
              </div>
            )}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> {t.common.loading}</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> {t.auth.student.login}</>
              )}
            </button>

          </form>
        )}

        {mode === 'teacher' && (
          <form onSubmit={handleTeacherLogin} className="login-form">
            <div className="form-group">
              <label><i className="fas fa-key"></i>{t.auth.teacher.accessCode}</label>
              <input
                type="password"
                className="login-input"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="••••••"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-users"></i>{t.auth.teacher.group}</label>
              <select
                className="login-input"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                disabled={isLoading}
                required
              >
                {DEFAULT_GROUPS.map((g: string) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {displayError && (
              <div className="login-error">
                <i className="fas fa-exclamation-circle"></i>
                {displayError}
              </div>
            )}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> {t.common.loading}</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> {t.auth.teacher.login}</>
              )}
            </button>

            <div className="login-links">
              <button type="button" className="link-button" onClick={() => setMode('student')}>
                {t.auth.teacher.backToStudent}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};