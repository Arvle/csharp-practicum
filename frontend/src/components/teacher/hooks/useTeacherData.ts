import { useState, useEffect } from 'react';
import { Assignment, Submission, StudentWithStats } from '../../../api/types';
import { apiClient } from '../../../api/client';

export const useTeacherData = () => {
    const [students, setStudents] = useState<StudentWithStats[]>([]); 
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [group, setGroup] = useState('ИСП-211');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assignmentsData, submissionsData] = await Promise.all([
                apiClient.getAssignments(),
                apiClient.getSubmissions()
            ]);
            
            setAssignments(assignmentsData);
            setSubmissions(submissionsData);

            const mockStudents: StudentWithStats[] = [
                {
                    id: 1,
                    name: 'Иванов Иван Иванович',
                    studentId: '12345',
                    group: 'ИСП-211',
                    status: 'completed',
                    submissions: submissionsData.filter(s => s.studentId === 1),
                    lastSubmission: submissionsData.find(s => s.studentId === 1),
                    grade: 5
                },
                {
                    id: 2,
                    name: 'Петров Петр Петрович',
                    studentId: '12346',
                    group: 'ИСП-211',
                    status: 'in-progress',
                    submissions: submissionsData.filter(s => s.studentId === 2),
                    lastSubmission: submissionsData.find(s => s.studentId === 2)
                },
                {
                    id: 3,
                    name: 'Сидорова Анна Сергеевна',
                    studentId: '12347',
                    group: 'ИСП-211',
                    status: 'not-started',
                    submissions: []
                }
            ];

            setStudents(mockStudents);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: students.length,
        completed: students.filter(s => s.status === 'completed').length,
        inProgress: students.filter(s => s.status === 'in-progress').length,
        notStarted: students.filter(s => s.status === 'not-started').length,
        averageGrade: students.reduce((acc, s) => acc + (s.grade || 0), 0) / students.length || 0
    };

    const getStatusText = (status: string): string => {
        switch(status) {
            case 'completed': return 'Сдано';
            case 'in-progress': return 'В процессе';
            default: return 'Не начато';
        }
    };

    const getStatusClass = (status: string): string => {
        switch(status) {
            case 'completed': return 'status-completed';
            case 'in-progress': return 'status-progress';
            default: return 'status-notstarted';
        }
    };

    return {
        students,
        setStudents,     
        submissions,
        setSubmissions,
        assignments,
        loading,
        group,
        setGroup,
        stats,
        getStatusText,
        getStatusClass,
        refreshData: loadData
    };
};