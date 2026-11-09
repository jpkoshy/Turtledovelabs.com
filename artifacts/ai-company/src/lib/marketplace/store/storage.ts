const PREFIX = 'tdl-market:';
const mem = new Map<string, string>();

function ls(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = ls()?.getItem(PREFIX + key) ?? null;
  } catch {
    raw = null;
  }
  if (raw == null) raw = mem.get(key) ?? null;
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  const s = JSON.stringify(value);
  mem.set(key, s);
  try {
    ls()?.setItem(PREFIX + key, s);
  } catch {
    /* in-memory fallback already set */
  }
}

export function remove(key: string): void {
  mem.delete(key);
  try {
    ls()?.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const delay = () => new Promise<void>((r) => setTimeout(r, 50 + Math.random() * 100));
