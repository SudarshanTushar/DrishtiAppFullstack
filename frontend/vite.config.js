import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // 👈 इसे False कर दें (Debugging के लिए)
    sourcemap: true, // 👈 यह Error की सही लाइन बताएगा
  },
  server: {
    port: 3000,
  }
});