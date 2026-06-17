export interface StoredDraft {
  code: string;
  updatedAt: string;
}

export function draftStorageKey(userId: number, assignmentId: number): string {
  return `csharp_practicum_draft_${userId}_${assignmentId}`;
}

export function loadDraft(userId: number, assignmentId: number): StoredDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(userId, assignmentId));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<StoredDraft>;
      if (typeof parsed.code === 'string' && typeof parsed.updatedAt === 'string') {
        return { code: parsed.code, updatedAt: parsed.updatedAt };
      }
    } catch {
      return { code: raw, updatedAt: '1970-01-01T00:00:00.000Z' };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveDraft(userId: number, assignmentId: number, code: string, updatedAt?: string): StoredDraft | null {
  try {
    const draft = { code, updatedAt: updatedAt || new Date().toISOString() };
    localStorage.setItem(draftStorageKey(userId, assignmentId), JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(userId: number, assignmentId: number): void {
  try {
    localStorage.removeItem(draftStorageKey(userId, assignmentId));
  } catch {
  }
}
