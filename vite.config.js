import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const isSvelteStyleQuery = (id) => {
  return id.includes('.svelte') && id.includes('type=style') && id.includes('lang.css');
};

export default defineConfig({
  plugins: [
    sveltekit(),
    {
      name: 'svelte-style-endpoint-noop',
      enforce: 'pre',
      apply: 'serve',
      transform(code, id) {
        if (!isSvelteStyleQuery(id)) return null;

        return {
          code: '/* Empty response for Svelte style endpoint to avoid postcss parsing raw Svelte markup. */\n',
          map: null
        };
      }
    }
  ],
  server: {
    proxy: {
       '/api': 'http://localhost:8080',
       //'/api': 'https://pickleball-backend-production-150f.up.railway.app'
    }
  }
});
