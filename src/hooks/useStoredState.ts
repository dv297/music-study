import { useEffect, useState } from "react";

/**
 * Like useState, but the initial value is read from localStorage and every
 * update is written back, so it survives a reload. Falls back to
 * defaultValue when storage is empty, corrupt, or unavailable (e.g. private
 * browsing).
 */
export function useStoredState<T>(key: string, defaultValue: T): [T, (value: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? defaultValue : (JSON.parse(stored) as T);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable or full — the setting just won't persist.
    }
  }, [key, value]);

  return [value, setValue];
}
