import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import Toast from './components/common/Toast.jsx'
import { initMetaPixel } from './utils/metaPixel'

// Initialize Meta Pixel (if configured)
initMetaPixel();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toast />
    </ThemeProvider>
  </StrictMode>,
)
