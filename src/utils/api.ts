export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://orion-back-4.onrender.com/api')
  .replace(/\/$/, '')
  .replace(/\/login$/, '');

export function buildUrl(path: string) {
  if (!path) return API_BASE;
  return API_BASE + (path.startsWith('/') ? path : '/' + path);
}

// ORIGIN is the server origin (without the /api suffix) for serving static files
export const ORIGIN = API_BASE.replace(/\/api$/, '').replace(/\/$/, '');
