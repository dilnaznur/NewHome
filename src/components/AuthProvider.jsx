import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function init() {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) return
      if (error) console.warn(error)

      let nextSession = data?.session ?? null

      // Make auth "invisible": try anonymous sign-in if there's no session.
      if (!nextSession) {
        try {
          const fn = supabase.auth.signInAnonymously
          if (typeof fn === 'function') {
            const res = await fn.call(supabase.auth)
            if (!isMounted) return
            if (res?.error) {
              console.warn(res.error)
            } else {
              nextSession = res?.data?.session ?? null
            }
          }
        } catch (e) {
          console.warn(e)
        }
      }

      setSession(nextSession)
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      isMounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
