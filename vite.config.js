import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.VITE_BASE_PATH || '/', plugins: [react()], server: { port: 5177, strictPort: true, proxy: { '/api': { target: process.env.API_URL || 'http://localhost:5000', changeOrigin: true } } } });
