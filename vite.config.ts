
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 'base: ./' ensures that all generated assets (JS/CSS) use relative paths.
  // This is critical for preview environments like Google IDX or Cloud Shell
  // where the app might be served from a subpath or a proxy.
  base: './',
  server: {
    port: 3000,
    host: true
  }
});
