import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import './styles/tailwind.css'
import './styles/base.css'

// GoogleOAuthProvider initialises fine with any non-empty string — sign-in
// simply fails gracefully if the client ID is invalid (handled by onError in
// Login / Signup). An empty string would crash the GIS SDK script load.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'unconfigured'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
)
