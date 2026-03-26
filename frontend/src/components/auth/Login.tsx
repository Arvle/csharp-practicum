import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../locales';
import { DEFAULT_GROUPS } from '../../config/constants';

type LoginMode = 'student' | 'teacher' | 'register' | 'forgot';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>('student');
  const { login, isLoading, error } = useAuth();
  const { t } = useTranslation();
  
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [group, setGroup] = useState(DEFAULT_GROUPS[0]);
  
  const [accessCode, setAccessCode] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!studentId.trim()) {
      setLocalError(t.auth.errors.studentIdRequired);
      return;
    }
    if (!fullName.trim()) {
      setLocalError(t.auth.errors.fullNameRequired);
      return;
    }
    if (!group) {
      setLocalError(t.auth.errors.groupRequired);
      return;
    }

    const success = await login({ studentId, fullName, group }, 'student');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!email.trim() || !password.trim() || !fullName.trim() || !studentId.trim() || !group) {
      setLocalError(t.auth.errors.emailRequired);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t.auth.errors.passwordsMismatch);
      return;
    }

    setSuccess(t.auth.register.success);
    setTimeout(() => setMode('student'), 2000);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!email.trim()) {
      setLocalError(t.auth.errors.emailRequired);
      return;
    }

    setSuccess(t.auth.forgot.success);
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
            {mode === 'register' && t.auth.register.title}
            {mode === 'forgot' && t.auth.forgot.title}
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

            <div className="form-group">
              <label><i className="fas fa-user"></i>{t.auth.student.fullName}</label>
              <input
                type="text"
                className="login-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-users"></i>{t.auth.student.group}</label>
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
                <><i className="fas fa-sign-in-alt"></i> {t.auth.student.login}</>
              )}
            </button>

            <div className="login-links">
              <button type="button" className="link-button" onClick={() => setMode('register')}>
                {t.auth.student.noAccount}
              </button>
              <button type="button" className="link-button" onClick={() => setMode('forgot')}>
                {t.auth.student.forgotPassword}
              </button>
            </div>
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

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label><i className="fas fa-envelope"></i>{t.auth.register.email}</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-user"></i>{t.auth.register.fullName}</label>
              <input
                type="text"
                className="login-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-id-card"></i>{t.auth.register.studentId}</label>
              <input
                type="text"
                className="login-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="12345"
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-users"></i>{t.auth.register.group}</label>
              <select
                className="login-input"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                required
              >
                {DEFAULT_GROUPS.map((g: string) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><i className="fas fa-lock"></i>{t.auth.register.password}</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-lock"></i>{t.auth.register.confirmPassword}</label>
              <input
                type="password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                required
              />
            </div>

            {displayError && (
              <div className="login-error">
                <i className="fas fa-exclamation-circle"></i>
                {displayError}
              </div>
            )}

            {success && (
              <div className="login-success">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <p className="login-footnote">{t.auth.registerNote}</p>

            <button type="submit" className="login-button">
              <i className="fas fa-user-plus"></i> {t.auth.register.submit}
            </button>

            <div className="login-links">
              <button type="button" className="link-button" onClick={() => setMode('student')}>
                {t.auth.student.backToLogin}
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label><i className="fas fa-envelope"></i>{t.auth.forgot.email}</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                autoFocus
              />
            </div>

            {displayError && (
              <div className="login-error">
                <i className="fas fa-exclamation-circle"></i>
                {displayError}
              </div>
            )}

            {success && (
              <div className="login-success">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <p className="login-footnote">{t.auth.forgotNote}</p>

            <button type="submit" className="login-button">
              <i className="fas fa-paper-plane"></i> {t.auth.forgot.submit}
            </button>

            <div className="login-links">
              <button type="button" className="link-button" onClick={() => setMode('student')}>
                {t.auth.student.backToLogin}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};