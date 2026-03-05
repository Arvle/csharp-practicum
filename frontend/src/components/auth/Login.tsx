import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type LoginMode = 'student' | 'teacher' | 'register' | 'forgot';

export const Login: React.FC = () => {
    const [mode, setMode] = useState<LoginMode>('student');
    const { login, isLoading } = useAuth();
    
    const [studentId, setStudentId] = useState('');
    const [fullName, setFullName] = useState('');
    const [group, setGroup] = useState('ИСП-211');
    
    const [accessCode, setAccessCode] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const groups = ['ИСП-211', 'ИСП-212', 'ИСП-213', 'ПРО-111', 'ПРО-112'];

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!studentId.trim()) {
            setError('Введите номер студенческого');
            return;
        }
        if (!fullName.trim()) {
            setError('Введите ФИО');
            return;
        }
        if (!group) {
            setError('Выберите группу');
            return;
        }

        const success = await login({ 
            type: 'student', 
            studentId: studentId.trim(), 
            fullName: fullName.trim(), 
            group 
        });
        
        if (!success) {
            setError('Ошибка входа');
        }
    };

    const handleTeacherLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!accessCode.trim()) {
            setError('Введите код доступа');
            return;
        }
        if (!group) {
            setError('Выберите группу');
            return;
        }

        const success = await login({ 
            type: 'teacher', 
            accessCode: accessCode.trim(), 
            group 
        });
        
        if (!success) {
            setError('Ошибка входа. Проверьте код доступа');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim() || !password.trim() || !fullName.trim() || !studentId.trim() || !group) {
            setError('Заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setSuccess('Регистрация успешна! Теперь вы можете войти.');
        setTimeout(() => setMode('student'), 2000);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Введите email');
            return;
        }

        setSuccess('Инструкции по восстановлению отправлены на email');
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <i className="fas fa-code login-icon"></i>
                    <h1>C# Практикум</h1>
                    <p>
                        {mode === 'student' && 'Вход для студента'}
                        {mode === 'teacher' && 'Вход для преподавателя'}
                        {mode === 'register' && 'Регистрация'}
                        {mode === 'forgot' && 'Восстановление пароля'}
                    </p>
                </div>

                <div className="login-tabs">
                    <button 
                        className={`tab ${mode === 'student' ? 'active' : ''}`}
                        onClick={() => setMode('student')}
                        type="button"
                    >
                        <i className="fas fa-user-graduate"></i>
                        Студент
                    </button>
                    <button 
                        className={`tab ${mode === 'teacher' ? 'active' : ''}`}
                        onClick={() => setMode('teacher')}
                        type="button"
                    >
                        <i className="fas fa-chalkboard-teacher"></i>
                        Преподаватель
                    </button>
                </div>

                {mode === 'student' && (
                    <form onSubmit={handleStudentLogin} className="login-form">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-id-card"></i>
                                Номер студенческого
                            </label>
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
                            <label>
                                <i className="fas fa-user"></i>
                                ФИО
                            </label>
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
                            <label>
                                <i className="fas fa-users"></i>
                                Группа
                            </label>
                            <select
                                className="login-input"
                                value={group}
                                onChange={(e) => setGroup(e.target.value)}
                                disabled={isLoading}
                                required
                            >
                                {groups.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <div className="login-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="login-button" disabled={isLoading}>
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Вход...</>
                            ) : (
                                <><i className="fas fa-sign-in-alt"></i> Войти</>
                            )}
                        </button>

                        <div className="login-links">
                            <button 
                                type="button" 
                                className="link-button"
                                onClick={() => setMode('register')}
                            >
                                Нет аккаунта? Зарегистрироваться
                            </button>
                            <button 
                                type="button" 
                                className="link-button"
                                onClick={() => setMode('forgot')}
                            >
                                Забыли пароль?
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'teacher' && (
                    <form onSubmit={handleTeacherLogin} className="login-form">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-key"></i>
                                Код доступа
                            </label>
                            <input
                                type="password"
                                className="login-input"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="teacher_2026"
                                disabled={isLoading}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-users"></i>
                                Группа
                            </label>
                            <select
                                className="login-input"
                                value={group}
                                onChange={(e) => setGroup(e.target.value)}
                                disabled={isLoading}
                                required
                            >
                                {groups.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <div className="login-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="login-button" disabled={isLoading}>
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Вход...</>
                            ) : (
                                <><i className="fas fa-sign-in-alt"></i> Войти</>
                            )}
                        </button>

                        <div className="login-links">
                            <button 
                                type="button" 
                                className="link-button"
                                onClick={() => setMode('student')}
                            >
                                ← Вход для студента
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'register' && (
                    <form onSubmit={handleRegister} className="login-form">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-envelope"></i>
                                Email
                            </label>
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
                            <label>
                                <i className="fas fa-user"></i>
                                ФИО
                            </label>
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
                            <label>
                                <i className="fas fa-id-card"></i>
                                Номер студенческого
                            </label>
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
                            <label>
                                <i className="fas fa-users"></i>
                                Группа
                            </label>
                            <select
                                className="login-input"
                                value={group}
                                onChange={(e) => setGroup(e.target.value)}
                                required
                            >
                                {groups.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-lock"></i>
                                Пароль
                            </label>
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
                            <label>
                                <i className="fas fa-lock"></i>
                                Подтверждение пароля
                            </label>
                            <input
                                type="password"
                                className="login-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="login-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="login-success">
                                <i className="fas fa-check-circle"></i>
                                {success}
                            </div>
                        )}

                        <button type="submit" className="login-button">
                            <i className="fas fa-user-plus"></i> Зарегистрироваться
                        </button>

                        <div className="login-links">
                            <button 
                                type="button" 
                                className="link-button"
                                onClick={() => setMode('student')}
                            >
                                ← Уже есть аккаунт? Войти
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'forgot' && (
                    <form onSubmit={handleForgotPassword} className="login-form">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-envelope"></i>
                                Email
                            </label>
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

                        {error && (
                            <div className="login-error">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="login-success">
                                <i className="fas fa-check-circle"></i>
                                {success}
                            </div>
                        )}

                        <button type="submit" className="login-button">
                            <i className="fas fa-paper-plane"></i> Отправить инструкции
                        </button>

                        <div className="login-links">
                            <button 
                                type="button" 
                                className="link-button"
                                onClick={() => setMode('student')}
                            >
                                ← Вернуться к входу
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};