import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValueState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : JSON.parse(stored) as T;
    } catch { return initial; }
  });
  const setValue = useCallback((next: T | ((current: T) => T)) => {
    setValueState(current => {
      const resolved = next instanceof Function ? next(current) : next;
      try { localStorage.setItem(key, JSON.stringify(resolved)); } catch { /* ignored */ }
      return resolved;
    });
  }, [key]);
  return [value, setValue] as const;
}
