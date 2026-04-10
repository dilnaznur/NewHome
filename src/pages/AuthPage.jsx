import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { Button } from '../components/ui/Button'
 

export function AuthPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => {
    const from = location.state?.from
    return typeof from === 'string' && from.startsWith('/') ? from : '/post'
  }, [location.state])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={redirectTo} replace />

  async function continueAnonymous() {
    setError('')
    setLoading(true)

    try {
      const fn = supabase.auth.signInAnonymously
      if (typeof fn !== 'function') {
        throw new Error('Анонимный вход недоступен в текущей конфигурации Supabase.')
      }

      const { error: signInError } = await fn.call(supabase.auth)
      if (signInError) throw signInError

      navigate(redirectTo, { replace: true })
    } catch (e) {
      setError(e?.message ?? 'Не удалось выполнить вход')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-md">
        <div className="card p-6 md:p-8">
          <div className="text-3xl">🐾</div>
          <h1 className="mt-3 text-2xl font-extrabold">Войти / Зарегистрироваться</h1>
          <p className="mt-2 text-sm text-black/60">
            Никаких писем и паролей — быстрый вход, чтобы вы могли публиковать объявления.
          </p>

          {error ? (
            <div className="mt-4 text-sm font-semibold text-app-primary">{error}</div>
          ) : (
            <div className="mt-4 rounded-2xl bg-black/5 p-4 text-sm text-black/70">
              Если появится ошибка, включите в Supabase: Auth → Providers → Anonymous sign-ins.
            </div>
          )}

          <div className="mt-6">
            <Button variant="primary" className="w-full" disabled={loading} onClick={continueAnonymous}>
              {loading ? 'Входим…' : 'Продолжить'}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-black/50">
          После входа вы вернётесь к созданию объявления.
        </div>
      </div>
    </div>
  )
}
