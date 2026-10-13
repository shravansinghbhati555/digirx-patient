import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 5174 so the portal can run next to the clinic app (5173) and API (4000).
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 4174, strictPort: true },
});
