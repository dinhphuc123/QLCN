import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ClassSettingsProvider } from './context/ClassSettingsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ClassSettingsProvider>
        <App />
      </ClassSettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
