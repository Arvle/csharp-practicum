import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const JoinSession: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { user, joinSession, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.role === 'student' ? user.fullName : '');

  useEffect(() => {
    if (user?.role === 'student' && !name.trim()) {
      setName(user.fullName);
    }
  }, [user, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;
    const ok = await joinSession(token, { fullName: name.trim() });
    if (ok) navigate('/student');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Присоединиться к уроку</h1>
          {user?.role === 'student' && <p className="login-subtitle">Можно войти в новый урок под тем же именем.</p>}
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label>ФИО</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              disabled={isLoading}
              autoFocus
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn-submit" disabled={isLoading || !name.trim()}>
            {isLoading ? 'Подключение...' : 'Начать'}
          </button>
        </form>
      </div>
    </div>
  );
};
