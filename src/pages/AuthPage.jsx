import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Fields'

export function AuthPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => {
    const from = location.state?.from
    return typeof from === 'string' && from.startsWith('/') ? from : '/post'
  }, [location.state])

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to={redirectTo} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const emailRedirectTo = `${window.location.origin}${redirectTo}`

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)

    // If the user already has an active session (some providers), go now.
    const { data } = await supabase.auth.getSession()
    if (data?.session) navigate(redirectTo, { replace: true })
  }

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-md">
        <div className="card p-6 md:p-8">
          <div className="text-3xl">🐾</div>
          <h1 className="mt-3 text-2xl font-extrabold">Войти / Зарегистрироваться</h1>
          <p className="mt-2 text-sm text-black/60">
            Мы отправим ссылку для входа на почту. Никаких паролей.
          </p>

          <form className="mt-6" onSubmit={onSubmit}>
            <Label>Email</Label>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error ? <div className="mt-3 text-sm font-semibold text-app-primary">{error}</div> : null}
            {sent ? (
              <div className="mt-3 rounded-2xl bg-black/5 p-4 text-sm">
                Ссылка отправлена. Проверьте почту и откройте письмо.
              </div>
            ) : null}

            <div className="mt-5">
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Отправляем…' : 'Войти / Зарегистрироваться'}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-xs text-black/50">
          После входа вы вернётесь к созданию объявления.
        </div>
      </div>
    </div>
  )
}
