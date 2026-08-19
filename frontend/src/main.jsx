import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { demonstrateEventLoop, demonstrateHoisting } from './utils/javascriptConcepts'

// Initialize JS core runtime patterns
if (typeof window !== 'undefined') {
  demonstrateHoisting();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
