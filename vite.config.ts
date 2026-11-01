import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-canvas': ['canvas-confetti'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
