import { useState } from 'react';
import { Submission, StudentWithStats } from '../../../api/types';
import { useNotifications } from '../../common/hooks/useNotifications';

export const useGrading = (
    students: StudentWithStats[],
    setStudents: React.Dispatch<React.SetStateAction<StudentWithStats[]>>, 
    submissions: Submission[],
    setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>     
) => {
    const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [grade, setGrade] = useState<number>(5);
    const [comment, setComment] = useState('');
    const { showNotification } = useNotifications();

    const handleGradeSubmit = () => {
        if (!selectedSubmission || !selectedStudent) return;

        setStudents(prev => prev.map(s => 
            s.id === selectedStudent.id
                ? { 
                    ...s, 
                    grade,
                    lastSubmission: s.lastSubmission ? {
                        ...s.lastSubmission, 
                        grade, 
                        teacherComment: comment 
                    } : undefined
                } 
                : s
        ));

        setSubmissions(prev => prev.map(s =>
            s.id === selectedSubmission.id
                ? { ...s, grade, teacherComment: comment }
                : s
        ));

        showNotification('success', 'Grade saved');
        
        closeGrading();
    };

    const openGrading = (student: StudentWithStats, submission: Submission) => {
        setSelectedStudent(student);
        setSelectedSubmission(submission);
        setGrade(submission.grade || 5);
        setComment(submission.teacherComment || '');
    };

    const closeGrading = () => {
        setSelectedSubmission(null);
        setSelectedStudent(null);
        setGrade(5);
        setComment('');
    };

    return {
        selectedStudent,
        selectedSubmission,
        grade,
        comment,
        setGrade,
        setComment,
        handleGradeSubmit,
        openGrading,
        closeGrading
    };
};