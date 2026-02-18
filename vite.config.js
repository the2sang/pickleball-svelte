import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const normalizeApiBase = (raw) => {
  const value = (raw || "http://localhost:8080").trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return `http://${value}`;
};

const apiProxyTarget = normalizeApiBase(process.env.API_PROXY_TARGET || "http://localhost:8080");

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
