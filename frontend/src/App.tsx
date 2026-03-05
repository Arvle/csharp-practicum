import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { StudentView } from './components/student/StudentView';
import { TeacherView } from './components/teacher/TeacherView';
import { Login } from './components/auth/Login';
import './App.css';

export const App: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Загрузка...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return user.role === 'student' ? <StudentView /> : <TeacherView />;
};