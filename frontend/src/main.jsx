import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import './styles/base.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// GoogleOAuthProvider crashes with an empty clientId, so only mount it when
// a real Client ID is configured. The pass-through provider is a no-op wrapper
// that renders children directly — the Google buttons won't appear but the
// rest of the app works fine.
const GoogleProvider = googleClientId
  ? GoogleOAuthProvider
  : ({ children }) => <>{children}</>

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleProvider>
  </StrictMode>
)
