/**
 * ZEGA AI — Centralized API Base URL Resolver
 * 
 * Determines backend API base URL depending on environment variables and runtime location.
 * Production Default: https://zega-ai.onrender.com
 */
export const getApiBase = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_URL) {
    return String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  return 'https://zega-ai.onrender.com';
};

export const API_BASE = getApiBase();
