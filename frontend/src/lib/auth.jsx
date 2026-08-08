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
    const data = await api.login(email, password)
    const { access_token, user: userData } = data
    setToken(access_token)
    const me = userData || (await api.me())
    setUser(me)
    return me
  }, [])

  const loginWithGoogle = useCallback(async (payload) => {
    const data = await api.loginWithGoogle(payload)
    const { access_token, is_new_user, user: userData } = data
    setToken(access_token)
    const me = userData || (await api.me())
    setUser(me)
    return { user: me, is_new_user }
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
  const context = useContext(AuthContext)
  return context || {
    user: null,
    loading: false,
    login: async () => null,
    signup: async () => null,
    logout: async () => {},
    refresh: async () => null,
    loginWithGoogle: async () => ({ user: null, is_new_user: false }),
  }
}
