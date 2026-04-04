import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AlertProvider } from './context/AlertContext'
import Alert from './components/Alert'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlertProvider>
      <Alert />
      <App />
    </AlertProvider>
  </StrictMode>,
)
