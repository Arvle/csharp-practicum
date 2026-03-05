import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    role: 'student' | 'teacher';
    fullName?: string;
    group?: string;
    studentId?: string;
}

interface LoginData {
    type: 'student' | 'teacher';
    studentId?: string;
    fullName?: string;
    group?: string;
    accessCode?: string;
}

interface AuthContextType {
    user: User | null;
    login: (data: LoginData) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockLogin = async (data: LoginData): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (data.type === 'student') {
        if (!data.studentId || !data.fullName || !data.group) {
            return null;
        }
        
        return {
            id: Math.floor(Math.random() * 1000),
            username: data.studentId,
            role: 'student',
            fullName: data.fullName,
            group: data.group,
            studentId: data.studentId
        };
    } else {
        if (data.accessCode !== 'teacher_2026' && data.accessCode !== 'admin') {
            return null;
        }
        
        return {
            id: 2,
            username: 'teacher',
            role: 'teacher',
            fullName: 'Преподаватель',
            group: data.group
        };
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                setIsLoading(false);
                return;
            } catch (e) {
                console.error('Failed to parse saved user', e);
                localStorage.removeItem('user');
            }
        }
        
        console.log('No saved user, auto-login as student for testing');
        const testUser = {
            id: 1,
            username: 'student',
            role: 'student' as const,
            fullName: 'Иванов Иван',
            group: 'ИСП-211',
            studentId: '12345'
        };
        setUser(testUser);
        localStorage.setItem('user', JSON.stringify(testUser));
        setIsLoading(false);
    }, []);

    const login = async (data: LoginData): Promise<boolean> => {
        setIsLoading(true);
        try {
            const userData = await mockLogin(data);
            if (userData) {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                setIsLoading(false);
                return true;
            }
            setIsLoading(false);
            return false;
        } catch (error) {
            console.error('Login error:', error);
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
