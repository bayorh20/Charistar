import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/performanceOptimizer.js'
import './index.css'
import App from './App.jsx'

import { initFirebaseAnalytics, initPostHog } from './utils/analytics';

// Initialize Analytics
initFirebaseAnalytics();
initPostHog();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
