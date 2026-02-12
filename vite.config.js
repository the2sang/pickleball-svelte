import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
       '/api': 'http://localhost:8080',
       //'/api': 'https://pickleball-backend-production-150f.up.railway.app'
    }
  }
});
