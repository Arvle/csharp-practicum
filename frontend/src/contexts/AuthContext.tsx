import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { studentLogin, teacherLogin, StudentLoginData, TeacherLoginData } from '../api/auth';
import { User } from '../api/types';
import { getToken, setToken, setUser, removeToken, removeUser, getUser } from '../utils/token';
import { useTranslation } from '../locales';

interface AuthContextType {
  user: User | null;
  login: (data: StudentLoginData | TeacherLoginData, role: 'student' | 'teacher') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    
    if (token && savedUser) {
      setUserState(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: StudentLoginData | TeacherLoginData, role: 'student' | 'teacher'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      if (role === 'student') {
        response = await studentLogin(data as StudentLoginData);
      } else {
        response = await teacherLogin(data as TeacherLoginData);
      }
      
      setToken(response.token);
      setUser(response.user);
      setUserState(response.user);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : t.auth.errors.loginFailed;
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};