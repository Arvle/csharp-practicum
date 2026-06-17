import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../locales';

export const Login: React.FC = () => {
  const { loginTeacher, isLoading, error } = useAuth();
  const { t } = useTranslation();
  
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) return;
    await loginTeacher({ login: login.trim(), password: password.trim() });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{t.auth.teacher.title}</h1>
          <p className="login-subtitle">{t.auth.teacher.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label>{t.auth.teacher.loginField || 'Логин (ФИО)'}</label>
            <input type="text" value={login} onChange={e => setLogin(e.target.value)} placeholder="Иванов Иван Иванович" disabled={isLoading} autoFocus />
          </div>
          <div className="form-field">
            <label>{t.auth.teacher.passwordField || 'Пароль'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Вход...' : t.auth.teacher.login}
          </button>
        </form>
      </div>
    </div>
  );
};