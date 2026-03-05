import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Assignment, Submission } from '../../../api/types';
import { apiClient } from '../../../api/client';

export const useStudentData = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assignmentsData, submissionsData] = await Promise.all([
                apiClient.getAssignments(),
                apiClient.getStudentSubmissions(user?.id || 1)
            ]);
            
            setAssignments(assignmentsData || []); 
            setSubmissions(submissionsData || []); 
            
            if (assignmentsData && assignmentsData.length > 0) {
                setSelectedId(assignmentsData[0].id);
            }
        } catch (err) {
            setError('Ошибка загрузки данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getAssignmentStatus = (assignmentId: number): 'pending' | 'done' | 'incorrect' => {
        if (!submissions || !Array.isArray(submissions)) return 'pending';
        
        const submission = submissions.find(s => s.assignmentId === assignmentId);
        if (!submission) return 'pending';
        return submission.isCorrect ? 'done' : 'incorrect';
    };

    const getStatusText = (status: string): string => {
        switch(status) {
            case 'done': return 'Сдано';
            case 'incorrect': return 'Ошибка';
            default: return 'Ожидает';
        }
    };

    const refreshSubmissions = async () => {
        try {
            const data = await apiClient.getStudentSubmissions(user?.id || 1);
            setSubmissions(data || []); 
        } catch (err) {
            console.error('Failed to refresh submissions:', err);
        }
    };

    const selectAssignment = (id: number) => {
        setSelectedId(id);
    };

    const currentAssignment = assignments?.find(a => a.id === selectedId) || null;

    return {
        assignments: assignments || [], 
        submissions: submissions || [],  
        loading,
        error,
        selectedId,
        currentAssignment,
        getAssignmentStatus,
        getStatusText,
        refreshSubmissions,
        selectAssignment,
        setSubmissions
    };
};