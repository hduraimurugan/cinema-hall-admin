import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from './context/AuthContext'
import { HallProvider } from './context/HallContext'
import { SettingsProvider } from './context/SettingsContext'
import './index.css'
import App from './App.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <HallProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </HallProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
