const normalizeApiBase = (raw) => {
  const value = (raw || "http://localhost:8080").trim();
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");
  if (value.startsWith("/")) return value.replace(/\/+$/, "");
  return `http://${value}`.replace(/\/+$/, "");
};

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);

export const buildApiUrl = (path) => {
  if (!path) return API_BASE;
  if (typeof path !== 'string') return `${API_BASE}`;
  const normalized = path.startsWith('/api') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};
