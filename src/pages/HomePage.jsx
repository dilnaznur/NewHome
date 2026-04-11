import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveAnimals, getMonthlyStats } from '../lib/animals'
import { AnimalCard } from '../components/AnimalCard'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

export function HomePage() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoadingStats(true)
    getMonthlyStats()
      .then((s) => {
        if (cancelled) return
        setStats(s)
        setLoadingStats(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message ?? 'Ошибка загрузки статистики')
        setLoadingStats(false)
      })

    setLoadingRecent(true)
    fetchActiveAnimals({ page: 0, pageSize: 6, sort: 'new' })
      .then((res) => {
        if (cancelled) return
        setRecent(res.items)
        setLoadingRecent(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message ?? 'Ошибка загрузки объявлений')
        setLoadingRecent(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const statsContent = useMemo(() => {
    if (loadingStats) {
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <Skeleton className="h-6 w-12" />
            <div className="mt-2 h-4 w-20 rounded bg-black/5" />
          </div>
          <div className="card p-4">
            <Skeleton className="h-6 w-12" />
            <div className="mt-2 h-4 w-20 rounded bg-black/5" />
          </div>
          <div className="card p-4">
            <Skeleton className="h-6 w-12" />
            <div className="mt-2 h-4 w-28 rounded bg-black/5" />
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-heading font-extrabold">{stats?.lost ?? 0}</div>
          <div className="mt-1 text-xs font-bold text-black/60">Потеряно (месяц)</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-heading font-extrabold">{stats?.found ?? 0}</div>
          <div className="mt-1 text-xs font-bold text-black/60">Найдено (месяц)</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-heading font-extrabold">{stats?.reunited ?? 0}</div>
          <div className="mt-1 text-xs font-bold text-black/60">Вернулись домой</div>
        </div>
      </div>
    )
  }, [loadingStats, stats])

  return (
    <div>
      <section className="container-app py-10">
        <div className="card overflow-hidden">
          <div className="relative px-6 py-10 md:px-10">
            <div className="absolute right-6 top-6 text-5xl opacity-20">🐾</div>
            <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
              Потерял питомца? Нашёл животное?
            </h1>
            <p className="mt-4 max-w-2xl text-base text-black/70 md:text-lg">
              «PawMap» помогает людям в Актобе быстро находить хозяев и спасать животных.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/post?type=lost" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full">Я потерял</Button>
              </Link>
              <Link to="/post?type=found" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full">Я нашёл</Button>
              </Link>
            </div>

            <div className="mt-8">{statsContent}</div>

            {error ? <div className="mt-4 text-sm font-semibold text-app-primary">{error}</div> : null}
          </div>
        </div>
      </section>

      <section className="container-app">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Свежие объявления</h2>
            <div className="mt-1 text-sm text-black/60">Последние 6 активных объявлений</div>
          </div>
          <Link
            to="/feed"
            className="rounded-full border border-app-border bg-white px-4 py-2 text-sm font-extrabold transition hover:-translate-y-0.5"
          >
            Смотреть все
          </Link>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loadingRecent
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="card overflow-hidden">
                  <div className="aspect-[4/3] bg-black/5" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-4 w-56" />
                    <Skeleton className="mt-3 h-8 w-full" />
                  </div>
                </div>
              ))
            : recent.map((a) => <AnimalCard key={a.id} animal={a} />)}
        </div>
      </section>

      <section className="container-app mt-10">
        <div className="card p-6 md:p-8">
          <h2 className="text-xl font-extrabold">Как это работает</h2>
          <div className="mt-1 text-sm text-black/60">Три простых шага — и шанс на встречу выше.</div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-card border border-app-border bg-white p-5">
              <div className="text-3xl">📝</div>
              <div className="mt-2 font-extrabold">Публикуй</div>
              <div className="mt-1 text-sm text-black/60">Добавь фото и точку на карте.</div>
            </div>
            <div className="rounded-card border border-app-border bg-white p-5">
              <div className="text-3xl">🧭</div>
              <div className="mt-2 font-extrabold">Сопоставляй</div>
              <div className="mt-1 text-sm text-black/60">Смотри ленту и карту рядом.</div>
            </div>
            <div className="rounded-card border border-app-border bg-white p-5">
              <div className="text-3xl">🤝</div>
              <div className="mt-2 font-extrabold">Возвращай</div>
              <div className="mt-1 text-sm text-black/60">Свяжись и отметь «Решено».</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
