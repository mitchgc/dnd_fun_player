import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Vitest 3.x enhanced features
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      // Enhanced coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Vitest 3.x performance optimizations
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        useAtomics: true
      }
    },
    // Enhanced test isolation
    isolate: true,
    // Better error reporting
    reporter: ['verbose', 'html'],
    // Vitest 3.x watch mode improvements
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/data': resolve(__dirname, './src/data')
    }
  }
})