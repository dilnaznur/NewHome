import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [trying, setTrying] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="card p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-black/10" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-black/10" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-black/10" />
        </div>
      </div>
    )
  }

  useEffect(() => {
    let cancelled = false

    async function ensureAnon() {
      if (user) return
      setError('')

      try {
        const fn = supabase.auth.signInAnonymously
        if (typeof fn !== 'function') return
        setTrying(true)
        const res = await fn.call(supabase.auth)
        if (cancelled) return
        if (res?.error) setError(res.error.message)
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Не удалось выполнить вход')
      } finally {
        if (!cancelled) setTrying(false)
      }
    }

    ensureAnon()
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) {
    return (
      <div className="container-app py-10">
        <div className="card p-6">
          <div className="text-lg font-extrabold">Нужен вход</div>
          <div className="mt-2 text-sm text-black/60">
            Чтобы публиковать и управлять своими постами, включите Anonymous sign-ins в Supabase.
          </div>
          {error ? <div className="mt-3 text-sm font-semibold text-app-primary">{error}</div> : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" disabled={trying} onClick={() => supabase.auth.signInAnonymously?.()}>
              {trying ? 'Входим…' : 'Попробовать снова'}
            </Button>
            <Link
              to="/auth"
              state={{ from: location.pathname + location.search }}
              className="rounded-full border border-app-border bg-white px-4 py-2.5 text-center text-sm font-extrabold transition hover:-translate-y-0.5"
            >
              Открыть страницу входа
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return children
}
