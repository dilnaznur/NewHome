import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../components/AuthProvider'
import { supabase } from '../lib/supabase'
import { deleteAnimal, resolveAnimal } from '../lib/animals'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDateShort, getDistrict } from '../lib/format'

export function MyPostsPage() {
  const { user } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error: qErr } = await supabase
          .from('animals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (qErr) throw qErr
        if (!cancelled) setItems(data ?? [])
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Ошибка загрузки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user.id])

  async function onResolve(id) {
    setError('')
    try {
      await resolveAnimal(id)
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'resolved' } : x)))
    } catch (e) {
      setError(e?.message ?? 'Не удалось обновить')
    }
  }

  async function onDelete(id) {
    setError('')
    const ok = window.confirm('Удалить объявление?')
    if (!ok) return

    try {
      await deleteAnimal(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      setError(e?.message ?? 'Не удалось удалить')
    }
  }

  return (
    <div className="container-app py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Мои объявления</h1>
          <div className="mt-1 text-sm text-black/60">Редактируйте, закрывайте и удаляйте свои посты</div>
        </div>
        <Link to="/post" className="hidden md:block">
          <Button variant="primary">+ Новое</Button>
        </Link>
      </div>

      {error ? <div className="mt-4 text-sm font-semibold text-app-primary">{error}</div> : null}

      <div className="mt-5 grid gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="mt-2 h-4 w-72" />
              </div>
            ))
          : null}

        {!loading && items.length === 0 ? (
          <div className="card p-6">
            <div className="text-sm font-semibold text-black/70">У вас пока нет объявлений.</div>
            <div className="mt-4">
              <Link to="/post">
                <Button variant="primary">Подать объявление</Button>
              </Link>
            </div>
          </div>
        ) : null}

        {!loading
          ? items.map((a) => (
              <div key={a.id} className="card overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[160px_1fr]">
                  <div className="aspect-[4/3] bg-black/5 md:aspect-auto">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl">🐾</div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge kind={a.type} />
                        <Badge kind={a.status} />
                      </div>
                      <div className="text-xs text-black/60">
                        {formatDateShort(a.created_at)} • {getDistrict(a.address) || 'Актобе'}
                      </div>
                    </div>

                    <div className="mt-2 text-sm font-extrabold text-black/80">{a.description}</div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Link to={`/post?edit=${a.id}`} className="sm:w-auto">
                        <Button variant="outline" className="w-full">Редактировать</Button>
                      </Link>
                      {a.status !== 'resolved' ? (
                        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onResolve(a.id)}>
                          Отметить как решено
                        </Button>
                      ) : null}
                      <Button variant="ghost" className="w-full sm:w-auto" onClick={() => onDelete(a.id)}>
                        Удалить
                      </Button>
                      <Link to={`/animal/${a.id}`} className="sm:ml-auto">
                        <Button variant="ghost" className="w-full sm:w-auto">Открыть →</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>

      <div className="mt-8 text-xs text-black/50">
        Примечание: если политика RLS разрешает SELECT только для активных, закрытые посты могут не отображаться.
      </div>
    </div>
  )
}
