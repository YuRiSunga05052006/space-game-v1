import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    watch: {
      // Tauri rebuilds lock DLLs under target/; watching them causes EBUSY on Windows.
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'es2022',
  },
});
