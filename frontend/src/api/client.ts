import { Assignment, Submission, SubmissionDto, Project } from './types';

const API_BASE = 'http://localhost:8080/api';

class ApiError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = 'ApiError';
    }
}

export const apiClient = {
    async checkStatus(): Promise<boolean> {
        try {
            const res = await fetch(`${API_BASE}/assignments`);
            return res.ok;
        } catch {
            return false;
        }
    },

    async getAssignments(): Promise<Assignment[]> {
        const res = await fetch(`${API_BASE}/assignments`);
        if (!res.ok) throw new ApiError('Ошибка загрузки заданий', res.status);
        return res.json();
    },

    async getAssignment(id: number): Promise<Assignment> {
        const res = await fetch(`${API_BASE}/assignments/${id}`);
        if (!res.ok) throw new ApiError('Задание не найдено', res.status);
        return res.json();
    },

    async createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt'>): Promise<Assignment> {
        const res = await fetch(`${API_BASE}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment)
        });
        if (!res.ok) throw new ApiError('Ошибка создания задания', res.status);
        return res.json();
    },

    async updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment> {
        const res = await fetch(`${API_BASE}/assignments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment)
        });
        if (!res.ok) throw new ApiError('Ошибка обновления задания', res.status);
        return res.json();
    },

    async deleteAssignment(id: number): Promise<void> {
        const res = await fetch(`${API_BASE}/assignments/${id}`, { 
            method: 'DELETE' 
        });
        if (!res.ok) throw new ApiError('Ошибка удаления задания', res.status);
    },

    async submitCode(submission: SubmissionDto): Promise<Submission> {
        const res = await fetch(`${API_BASE}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission)
        });
        if (!res.ok) throw new ApiError('Ошибка отправки решения', res.status);
        return res.json();
    },

    async getSubmissions(assignmentId?: number): Promise<Submission[]> {
        const url = assignmentId 
            ? `${API_BASE}/submissions/assignment/${assignmentId}`
            : `${API_BASE}/submissions`;
        const res = await fetch(url);
        if (!res.ok) throw new ApiError('Ошибка загрузки решений', res.status);
        const data = await res.json();
        return data.map((sub: any) => ({
            ...sub,
            grade: sub.grade || undefined,
            teacherComment: sub.teacherComment || undefined
        }))
    },

    async getStudentSubmissions(studentId: number): Promise<Submission[]> {
        const res = await fetch(`${API_BASE}/submissions/student/${studentId}`);
        if (!res.ok) throw new ApiError('Ошибка загрузки решений студента', res.status);
        return res.json();
    },

    async getProjects(): Promise<Project[]> {
        const projects = localStorage.getItem('csharp_projects');
        return projects ? JSON.parse(projects) : [];
    },

    async saveProject(project: { name: string; description: string; code: string }): Promise<Project> {
        const projects = await this.getProjects();
        const newProject = {
            id: Date.now().toString(),
            ...project,
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
        localStorage.setItem('csharp_projects', JSON.stringify(projects));
        return newProject;
    },

    async deleteProject(id: string): Promise<boolean> {
        const projects = await this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        localStorage.setItem('csharp_projects', JSON.stringify(filtered));
        return true;
    }
};
