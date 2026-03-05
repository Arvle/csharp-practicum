import { useState } from 'react';
import { apiClient } from '../../../api/client';
import { useNotifications } from '../../common/hooks/useNotifications';

export const useCodeExecution = (
    assignmentId: number | null,
    studentId: number,
    onSubmissionComplete?: () => void
) => {
    const [code, setCode] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotifications();

    const handleRun = async () => {
        if (!assignmentId) return;
        
        setLoading(true);
        setOutput(['⏳ Running...']);
        
        try {
            const result = await apiClient.submitCode({
                assignmentId,
                studentId,
                code
            });
            
            const outputLines: string[] = [];
            if (result.output) {
                outputLines.push(...result.output.split('\n'));
            }
            if (result.errorMessage) {
                outputLines.push('⚠️ ' + result.errorMessage);
            }
            
            setOutput(outputLines.length ? outputLines : ['✓ Program executed (no output)']);
        } catch (error: any) {
            setOutput(['❌ ' + error.message]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!assignmentId) return;
        
        setLoading(true);
        setOutput(['⏳ Submitting solution...']);
        
        try {
            const result = await apiClient.submitCode({
                assignmentId,
                studentId,
                code
            });
            
            const outputLines: string[] = [];
            if (result.isCorrect) {
                outputLines.push('✅ Correct! Assignment completed successfully.');
                showNotification('success', 'Assignment submitted!');
            } else {
                outputLines.push('❌ Incorrect result. Try again.');
                showNotification('error', 'Solution incorrect');
            }
            
            if (result.output) {
                outputLines.push('📤 Program output:');
                outputLines.push(...result.output.split('\n'));
            }
            
            setOutput(outputLines);
            onSubmissionComplete?.();
        } catch (error: any) {
            setOutput(['❌ Submission error: ' + error.message]);
            showNotification('error', 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = (initialCode: string) => {
        setCode(initialCode);
    };

    return {
        code,
        setCode,
        output,
        setOutput,
        loading,
        handleRun,
        handleSubmit,
        handleReset
    };
};