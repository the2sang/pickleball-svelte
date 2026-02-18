import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

const normalizeApiBase = (raw) => {
  const value = (raw || "http://localhost:8080").trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return `http://${value}`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = normalizeApiBase(env.API_PROXY_TARGET || "http://localhost:8080");

  return {
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
  };
});
