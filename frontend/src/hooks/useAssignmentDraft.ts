import { useEffect, useRef } from 'react';
import { loadDraft, saveDraft } from '../utils/draftStorage';

/**
 * Черновик в localStorage при смене задания и debounce-сохранение (README: черновики студента).
 */
export function useAssignmentDraft(
  userId: number | undefined,
  assignmentId: number | null,
  code: string,
  setCode: (v: string) => void,
  initialCodeWhenNoDraft: string | undefined
): void {
  const skipSaveUntil = useRef(0);

  useEffect(() => {
    if (!userId || assignmentId === null) return;
    skipSaveUntil.current = Date.now() + 450;

    const stored = loadDraft(userId, assignmentId);
    if (stored !== null) {
      setCode(stored);
    } else if (initialCodeWhenNoDraft !== undefined) {
      setCode(initialCodeWhenNoDraft);
    }
  }, [userId, assignmentId, initialCodeWhenNoDraft, setCode]);

  useEffect(() => {
    if (!userId || assignmentId === null) return;
    if (Date.now() < skipSaveUntil.current) return;

    const t = window.setTimeout(() => {
      saveDraft(userId, assignmentId, code);
    }, 550);
    return () => window.clearTimeout(t);
  }, [code, userId, assignmentId]);
}
