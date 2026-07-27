import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, getToken, setToken, clearToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  // Restore session on mount if a token exists
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { access_token } = await api.login(email, password)
    setToken(access_token)
    const me = await api.me()
    setUser(me)
    return me
  }, [])

  const loginWithGoogle = useCallback(async (payload) => {
    const { access_token } = await api.loginWithGoogle(payload)
    setToken(access_token)
    const me = await api.me()
    setUser(me)
    return me
  }, [])

  const signup = useCallback(
    async (name, email, password) => {
      await api.register(name, email, password)
      return login(email, password)
    },
    [login]
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* non-fatal */
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const me = await api.me()
    setUser(me)
    return me
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
