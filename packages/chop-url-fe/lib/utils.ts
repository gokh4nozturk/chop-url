import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse<T>(
  value: string | Record<string, unknown>,
  defaultValue: T
): T {
  if (typeof value === 'object') {
    return value as T;
  }

  try {
    // Control karakterlerini temizle
    const cleanJson = value
      .split('')
      .filter((char) => char.charCodeAt(0) > 31)
      .join('')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');

    try {
      return JSON.parse(`"${cleanJson}"`) as T;
    } catch {
      return JSON.parse(cleanJson) as T;
    }
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return defaultValue;
  }
}
