import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,           // escuchar en 0.0.0.0
    port: 5174,           // puerto fijo
    strictPort: true,     // falla si el 5174 está ocupado
    cors: true,           // habilita CORS
    allowedHosts: true,  // acepta cualquier host (ngrok, LAN, etc.)
    proxy: {
      '/random': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/upload-audio': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})