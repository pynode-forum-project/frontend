import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.GATEWAY_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})