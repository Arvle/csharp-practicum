export interface ExecutionResult {
    isSuccess: boolean;
    output: string;
    errorMessage?: string;
    compilationErrors?: string[];
    warnings?: string[];
    returnValue?: any;
    executionTime: number;
}

export interface Assignment {
    id: number;
    title: string;
    description: string;
    initialCode: string;
    expectedOutput: string;
    createdAt: string;
}

export interface Submission {
    id: number;
    assignmentId: number;
    studentId: number;
    studentName?: string;
    code: string;
    output: string;
    isCorrect: boolean;
    errorMessage?: string;
    submittedAt: string;
    grade?: number;
    teacherComment?: string;
    gradedAt?: string;
    gradedByTeacherId?: number;
}
export interface SubmissionDto {
    assignmentId: number;
    studentId: number;
    code: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    code: string;
    createdAt: string;
}

export interface User {
    id: number;
    username: string;
    email?: string;
    role: 'student' | 'teacher';
    fullName?: string;
    studentId?: string;
    group?: string;
    createdAt?: string;
}

export interface StudentWithStats {
    id: number;
    name: string;
    studentId: string;
    group: string;
    status: 'completed' | 'in-progress' | 'not-started';
    lastSubmission?: Submission;
    grade?: number;
    submissions: Submission[];
}