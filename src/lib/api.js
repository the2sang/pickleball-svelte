const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080').replace(/\/+$/, '');

export const buildApiUrl = (path) => {
  if (!path) return API_BASE;
  if (typeof path !== 'string') return `${API_BASE}`;
  const normalized = path.startsWith('/api') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};
