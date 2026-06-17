export interface User {
  id: number;
  role: 'student' | 'teacher';
  fullName: string;
  createdAt?: string;
}


export interface SessionParticipant {
  id: number;
  fullName: string;
  joinedAt: string;
}

export interface Session {
  id: number;
  title: string;
  inviteToken: string;
  teacherId: number;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

export interface Resource {
  type: 'pdf' | 'link' | 'text';
  url: string;
  title: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  initialCode?: string;
  testCases?: TestCase[];
  resources?: Resource[];
  expectedOutput?: string;
  sessionId: number;
  createdAt: string;
}

export interface Submission {
  id: number;
  assignmentId: number;
  userId: number;
  sessionId: number;
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
}

export interface AssignmentRaw extends Omit<Assignment, 'testCases' | 'resources'> {
  testCases?: string;
  resources?: string; 
}

export interface CompilationResult {
  success: boolean;
  output: string;
  error: string;
  timeMs: number;
  compileMs: number;
  runMs: number;
  cacheHit: boolean;
}

export interface StudentProgress {
  id: number;
  name: string;
  assignments: Map<number, Submission>;
}

export interface StudentWithStats {
  id: number;
  name: string;
  studentId: number;
  status: Submission['status'];
  lastSubmission?: Submission;
  grade?: number;
}