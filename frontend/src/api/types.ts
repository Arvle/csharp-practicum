export interface ExecutionResult {
    isSuccess: boolean;
    output: string;
    errorMessage?: string;
    compilationErrors?: string[];
    warnings?: string[];
    returnValue?: any;
    executionTime: number;
}

/** Ответ POST /execute (совпадает с backend services.CompilationResult). */
export interface CompilationResult {
    success: boolean;
    output: string;
    error: string;
    timeMs: number;
    compileMs: number;
    runMs: number;
    cacheHit: boolean;
}

export interface StudentListItem {
    id: number;
    username: string;
    fullName?: string;
    studentId?: string;
    group?: string;
}

export interface Assignment {
    id: number;
    title: string;
    description: string;
    initialCode: string;
    expectedOutput: string;
    group?: string;
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
    status: 'pending_review' | 'done' | 'incorrect';
    errorMessage?: string;
    submittedAt: string;
    grade?: number;
    teacherComment?: string;
    gradedAt?: string;
    gradedByTeacherId?: number;
}
export interface SubmissionDto {
    assignmentId: number;
    code: string;
    input?: string;
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