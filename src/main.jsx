import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { loadMedia } from './media.js'

// Start fetching the exercise photo/video map while the login screen is still
// being typed into, so the first workout screen has it already.
loadMedia()

// The boundary sits OUTSIDE App on purpose. A render error inside App unmounts
// all of it, so a boundary placed within would go down with it.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
