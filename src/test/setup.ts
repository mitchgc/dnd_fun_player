import '@testing-library/jest-dom'
import { vi, beforeAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock Supabase for testing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInAnonymously: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }))
  }))
}))

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_APP_ENV: 'test',
    VITE_APP_VERSION: '2.0.0',
    VITE_DEBUG_MODE: 'false',
    DEV: false,
    MODE: 'test'
  },
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock window.visualViewport for mobile testing
Object.defineProperty(window, 'visualViewport', {
  writable: true,
  value: {
    height: 667,
    width: 375,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
})

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorageMock.clear()
})

// Setup before all tests
beforeAll(() => {
  // Silence console.warn for test environment unless needed
  if (!process.env.VERBOSE_TESTS) {
    console.warn = vi.fn()
  }
})

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Helper to create mock dice rolls with consistent results
  mockDiceRoll: (result = 10) => {
    vi.spyOn(Math, 'random').mockReturnValue((result - 1) / 20)
    return result
  },
  
  // Helper to restore all mocks
  restoreAllMocks: () => {
    vi.restoreAllMocks()
  }
}