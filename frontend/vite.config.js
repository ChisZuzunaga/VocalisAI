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
      // Configuración de proxy para todas las rutas /training/
      '/training/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/random': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/upload-audio': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      // proxy para tu endpoint de speech-to-text
      '/speech-to-text': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/audio': {
        target: 'http://localhost:8000',
        changeOrigin: true
     },
      '/api/chat': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})