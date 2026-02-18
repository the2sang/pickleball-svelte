const normalizeApiBase = (raw) => {
  const value = (raw || "http://localhost:8080").trim();
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");
  if (value.startsWith("/")) return value.replace(/\/+$/, "");
  return `http://${value}`.replace(/\/+$/, "");
};

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE || "/api");

export const buildApiUrl = (path) => {
  if (!path) return API_BASE;
  if (typeof path !== 'string') return `${API_BASE}`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE.endsWith('/api') && normalized.startsWith('/api/')) {
    return `${API_BASE}${normalized.slice(4)}`;
  }
  return `${API_BASE}${normalized}`;
};
