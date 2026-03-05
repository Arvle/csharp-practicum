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
        setOutput(['⏳ Выполнение...']);
        
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
            
            setOutput(outputLines.length ? outputLines : ['✓ Программа выполнена (нет вывода)']);
        } catch (error: any) {
            setOutput(['❌ ' + error.message]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!assignmentId) return;
        
        setLoading(true);
        setOutput(['⏳ Отправка решения...']);
        
        try {
            const result = await apiClient.submitCode({
                assignmentId,
                studentId,
                code
            });
            
            const outputLines: string[] = [];
            if (result.isCorrect) {
                outputLines.push('✅ Правильно! Задание выполнено успешно.');
                showNotification('success', 'Задание сдано!');
            } else {
                outputLines.push('❌ Неправильный результат. Попробуйте еще раз.');
                showNotification('error', 'Решение неверное');
            }
            
            if (result.output) {
                outputLines.push('📤 Вывод программы:');
                outputLines.push(...result.output.split('\n'));
            }
            
            setOutput(outputLines);
            onSubmissionComplete?.();
        } catch (error: any) {
            setOutput(['❌ Ошибка при отправке: ' + error.message]);
            showNotification('error', 'Ошибка отправки');
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