const listeners = new Map<string, Set<() => void>>();

export function subscribeToNotifications(userId: string, callback: () => void) {
  if (!listeners.has(userId)) listeners.set(userId, new Set());
  listeners.get(userId)!.add(callback);
  return () => {
    listeners.get(userId)?.delete(callback);
    if (listeners.get(userId)?.size === 0) listeners.delete(userId);
  };
}

export function emitNotification(userId: string) {
  listeners.get(userId)?.forEach((cb) => cb());
}
