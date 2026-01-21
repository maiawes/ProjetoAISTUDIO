
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base' deve ser '/' para Vercel/Netlify para que o BrowserRouter funcione corretamente
  // ao carregar assets a partir de sub-rotas (ex: /dashboard).
  base: '/', 
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
