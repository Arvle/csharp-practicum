export function draftStorageKey(userId: number, assignmentId: number): string {
  return `csharp_practicum_draft_${userId}_${assignmentId}`;
}

export function loadDraft(userId: number, assignmentId: number): string | null {
  try {
    return localStorage.getItem(draftStorageKey(userId, assignmentId));
  } catch {
    return null;
  }
}

export function saveDraft(userId: number, assignmentId: number, code: string): void {
  try {
    localStorage.setItem(draftStorageKey(userId, assignmentId), code);
  } catch {
    /* quota or private mode */
  }
}

export function clearDraft(userId: number, assignmentId: number): void {
  try {
    localStorage.removeItem(draftStorageKey(userId, assignmentId));
  } catch {
    /* ignore */
  }
}
