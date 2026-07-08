import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/AVP_virtuaEnvironment_Maker/',
  resolve: {
    alias: {
      'icodec/heic-only': path.resolve(root, 'node_modules/icodec/lib/heic.js'),
    },
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(root, 'index.dev.html'),
    },
  },
  worker: {
    format: 'es',
  },
});
