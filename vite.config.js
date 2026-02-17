import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const apiBase = process.env.VITE_API_BASE || 'http://localhost:8080';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api': {
        target: apiBase,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
