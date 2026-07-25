import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, getToken, setToken, clearToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  // Restore session on mount if a token exists
  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { access_token } = await api.login(email, password)
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

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const me = await api.me()
    setUser(me)
    return me
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
