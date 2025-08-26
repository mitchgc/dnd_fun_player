import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { checker } from 'vite-plugin-checker'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      // Latest React SWC features for Vite 7.x
      devTarget: 'esnext',
      // React Compiler integration (experimental)
      plugins: [
        // Note: React Compiler will be added when available for React 19
        // ['babel-plugin-react-compiler', {}]
      ]
    }),
    checker({
      typescript: true,
      overlay: {
        initialIsOpen: false,
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/data': resolve(__dirname, './src/data')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    target: 'esnext',
    // Vite 7.x enhanced build optimizations
    minify: 'esbuild',
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react']
        }
      }
    },
    // Enhanced build performance
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    hmr: { 
      overlay: false 
    },
    // Vite 7.x enhanced dev server
    warmup: {
      clientFiles: ['./src/App.jsx', './src/main.jsx']
    }
  },
  envPrefix: 'VITE_',
  esbuild: {
    target: 'esnext',
    format: 'esm',
    // Enhanced JSX transform for better performance
    jsx: 'automatic'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'lucide-react'],
    // Vite 7.x enhanced dependency optimization
    holdUntilCrawlEnd: false
  }
})