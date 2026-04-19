const STORAGE_PREFIX = 'cloudpoll:votes:';

function key(roomId: string): string {
  return `${STORAGE_PREFIX}${roomId}`;
}

export function getStoredVoteChoiceIds(roomId: string): number[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(key(roomId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((x): x is number => typeof x === 'number' && Number.isInteger(x));
  } catch {
    return [];
  }
}

export function setStoredVoteChoiceIds(
  roomId: string,
  choiceIds: Iterable<number>,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const sorted = [...new Set(choiceIds)].sort((a, b) => a - b);
  if (sorted.length === 0) {
    localStorage.removeItem(key(roomId));
    return;
  }
  localStorage.setItem(key(roomId), JSON.stringify(sorted));
}

export function clearStoredVoteChoiceIds(roomId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(key(roomId));
}

export function voteChoiceIdsFromStorage(roomId: string | undefined): Set<number> {
  if (!roomId) {
    return new Set();
  }
  const ids = getStoredVoteChoiceIds(roomId);
  return ids.length > 0 ? new Set(ids) : new Set();
}
