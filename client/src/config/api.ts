/**
 * Base URL for backend API calls.
 * In development, Vite proxies '/api' to 'http://localhost:5000'.
 * In production (e.g. deployed to Vercel), set VITE_API_URL in Vercel environment variables
 * to point to your deployed backend (e.g. https://erufile-server.onrender.com).
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};
