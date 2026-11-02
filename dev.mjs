import { createServer, build } from '../packages/studio-web/node_modules/vite/dist/node/index.js';
import react from '../packages/studio-web/node_modules/@vitejs/plugin-react/dist/index.js';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../packages/studio-web/', import.meta.url));
const config = { root, configFile: false, plugins: [react()], define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(process.env.VITE_SITE_URL || 'http://localhost:5173'), 'import.meta.env.VITE_STORIES_URL': JSON.stringify(process.env.VITE_STORIES_URL || 'http://localhost:5176'), 'import.meta.env.VITE_ORIGINALS_URL': JSON.stringify(process.env.VITE_ORIGINALS_URL || 'http://localhost:5177') }, build: { outDir: fileURLToPath(new URL('./dist', import.meta.url)), emptyOutDir: true }, server: { port: 5177, strictPort: true, proxy: { '/api': { target: process.env.API_URL || 'http://localhost:5000', changeOrigin: true } } } };
if (process.argv[2] === 'build') await build(config);
else { const server = await createServer(config); await server.listen(); server.printUrls(); }
