import { useEffect, useRef } from 'react';
import { draftsApi, StudentDraft } from '../api/drafts';
import { loadDraft, saveDraft, StoredDraft } from '../utils/draftStorage';

const emptyServerDate = '1970-01-01T00:00:00.000Z';

const isNewerOrEqual = (left?: string, right?: string): boolean => {
  return new Date(left || emptyServerDate).getTime() >= new Date(right || emptyServerDate).getTime();
};

const pickDraftCode = (
  localDraft: StoredDraft | null,
  serverDraft: StudentDraft | null,
  fallback: string | undefined
): { code: string; source: 'local' | 'server' | 'fallback' } => {
  const hasServer = typeof serverDraft?.updatedAt === 'string';
  const hasLocal = localDraft !== null;

  if (hasServer && hasLocal) {
    if (isNewerOrEqual(serverDraft?.updatedAt, localDraft?.updatedAt)) {
      return { code: serverDraft!.code, source: 'server' };
    }
    return { code: localDraft!.code, source: 'local' };
  }
  if (hasServer) return { code: serverDraft!.code, source: 'server' };
  if (hasLocal) return { code: localDraft!.code, source: 'local' };
  return { code: fallback || '', source: 'fallback' };
};

export function useAssignmentDraft(
  userId: number | undefined,
  assignmentId: number | null,
  code: string,
  setCode: (v: string) => void,
  initialCodeWhenNoDraft: string | undefined
): void {
  const skipSaveUntil = useRef(0);
  const activeKey = useRef('');
  const lastProgrammaticCode = useRef('');
  const userEditedBeforeServer = useRef(false);
  const ignoreNextSave = useRef(false);

  useEffect(() => {
    if (!userId || assignmentId === null) return;

    const key = `${userId}:${assignmentId}`;
    activeKey.current = key;
    userEditedBeforeServer.current = false;
    skipSaveUntil.current = Date.now() + 900;
    ignoreNextSave.current = true;

    const localDraft = loadDraft(userId, assignmentId);
    const preliminary = pickDraftCode(localDraft, null, initialCodeWhenNoDraft);
    lastProgrammaticCode.current = preliminary.code;
    setCode(preliminary.code);

    let cancelled = false;
    draftsApi.get(assignmentId)
      .then(serverDraft => {
        if (cancelled || activeKey.current !== key || userEditedBeforeServer.current) return;

        const selected = pickDraftCode(localDraft, serverDraft, initialCodeWhenNoDraft);
        skipSaveUntil.current = Date.now() + 900;
        lastProgrammaticCode.current = selected.code;
        setCode(selected.code);

        if (selected.source === 'server') {
          saveDraft(userId, assignmentId, selected.code, serverDraft.updatedAt);
        } else if (selected.source === 'local') {
          draftsApi.save(assignmentId, selected.code)
            .then(saved => saveDraft(userId, assignmentId, saved.code, saved.updatedAt))
            .catch(() => undefined);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [userId, assignmentId, initialCodeWhenNoDraft, setCode]);

  useEffect(() => {
    if (!userId || assignmentId === null) return;

    if (ignoreNextSave.current) {
      ignoreNextSave.current = false;
      return;
    }

    const programmaticChange = code === lastProgrammaticCode.current;
    if (Date.now() < skipSaveUntil.current && programmaticChange) return;
    if (Date.now() < skipSaveUntil.current && !programmaticChange) {
      userEditedBeforeServer.current = true;
    }

    const t = window.setTimeout(() => {
      const local = saveDraft(userId, assignmentId, code);
      draftsApi.save(assignmentId, code)
        .then(saved => saveDraft(userId, assignmentId, saved.code, saved.updatedAt || local?.updatedAt))
        .catch(() => undefined);
    }, 550);

    return () => window.clearTimeout(t);
  }, [code, userId, assignmentId]);
}
