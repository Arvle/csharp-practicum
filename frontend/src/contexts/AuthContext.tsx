import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { teacherLogin, joinSession, TeacherLoginData, JoinSessionData } from '../api/auth';
import { User } from '../api/types';
import { getToken, setToken, setUser, removeToken, removeUser, getUser } from '../utils/token';

interface AuthContextType {
  user: User | null;
  loginTeacher: (data: TeacherLoginData) => Promise<boolean>;
  joinSession: (token: string, data: JoinSessionData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();
    if (token && storedUser) setUserState(storedUser);
    setIsLoading(false);
  }, []);

  const loginTeacher = useCallback(async (data: TeacherLoginData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teacherLogin(data);
      setToken(response.token);
      setUser(response.user);
      setUserState(response.user);
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinSessionFn = useCallback(async (token: string, data: JoinSessionData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await joinSession(token, data);
      setToken(response.token);
      setUser(response.user);
      setUserState(response.user);
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginTeacher, joinSession: joinSessionFn, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth inside AuthProvider');
  return ctx;
};