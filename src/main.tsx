import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// Type-safe root element access
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure you have a div with id="root" in your HTML.')
}

// Create root with React 18.3+ features
const root = ReactDOM.createRoot(rootElement)

// Enhanced error boundary for development
const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// Enhanced error handling for development
if (import.meta.env.DEV) {
  // Development-only error handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    // Optionally prevent the default browser handling
    // event.preventDefault()
  })
  
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error)
  })
}

// Render the app
renderApp()

// Hot Module Replacement for development
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    renderApp()
  })
}