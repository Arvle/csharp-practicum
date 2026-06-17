import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { JoinSession } from './components/auth/JoinSession';
import { StudentView } from './components/student/StudentView';
import { TeacherView } from './components/teacher/TeacherView';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Загрузка...</div>;
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <Login />} />
      <Route path="/join/:token" element={<JoinSession />} />
      <Route path="/teacher" element={user?.role === 'teacher' ? <TeacherView /> : <Navigate to="/login" />} />
      <Route path="/student" element={user?.role === 'student' ? <StudentView /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);