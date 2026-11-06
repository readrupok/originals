import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Keep the crawlable server content visible while a route chunk loads.
const initialMarkup = document.getElementById('root').innerHTML;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div aria-busy="true" dangerouslySetInnerHTML={{ __html: initialMarkup }} />}><App /></Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
