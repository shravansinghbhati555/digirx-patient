import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Source stays in client/. Env and the production build live at the repo root.
// 5174 so the portal can run next to the clinic app (5173) and API (4000).
export default defineConfig({
  plugins: [react()],
  root: 'client',
  envDir: '..',
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 5174,
    allowedHosts: ["digirx-patient.abhianand.in"],
   },
  preview: { port: 4174, strictPort: true },
});
