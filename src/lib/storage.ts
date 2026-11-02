export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Lỗi khi đọc localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Lỗi khi lưu localStorage key "${key}":`, error);
    return false;
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Lỗi khi xóa localStorage key "${key}":`, error);
  }
}

