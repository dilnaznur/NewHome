import { useEffect, useMemo, useState } from 'react'
import { fetchActiveAnimals } from '../lib/animals'
import { AnimalCard } from '../components/AnimalCard'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Fields'
import { Skeleton } from '../components/ui/Skeleton'

export function FeedPage() {
  const [type, setType] = useState('all')
  const [species, setSpecies] = useState('all')
  const [color, setColor] = useState('')
  const [sort, setSort] = useState('new')
  const [search, setSearch] = useState('')

  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const canLoadMore = items.length < count

  const filters = useMemo(
    () => ({
      type,
      species,
      color: color?.trim() ? color.trim() : undefined,
      sort,
      search: search?.trim() ? search.trim() : undefined,
    }),
    [type, species, color, sort, search],
  )

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')
    setPage(0)

    fetchActiveAnimals({ ...filters, page: 0, pageSize: 12 })
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setCount(res.count)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message ?? 'Ошибка загрузки')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters])

  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    setError('')

    const nextPage = page + 1

    try {
      const res = await fetchActiveAnimals({ ...filters, page: nextPage, pageSize: 12 })
      setItems((prev) => [...prev, ...res.items])
      setCount(res.count)
      setPage(nextPage)
    } catch (e) {
      setError(e?.message ?? 'Ошибка загрузки')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="container-app py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Лента</h1>
          <div className="mt-1 text-sm text-black/60">Все активные объявления по Актобе</div>
        </div>
        <div className="text-sm font-semibold text-black/60">Найдено: {count}</div>
      </div>

      <div className="card mt-5 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Select value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="all">Все виды</option>
            <option value="dog">Собаки</option>
            <option value="cat">Кошки</option>
            <option value="other">Другое</option>
          </Select>

          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Все типы</option>
            <option value="lost">Потерян</option>
            <option value="found">Найден</option>
            <option value="stray">Бездомный</option>
          </Select>

          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Цвет (например, белый)" />

          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Сначала новые</option>
            <option value="views">По просмотрам</option>
          </Select>

          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по описанию" />
        </div>
      </div>

      {error ? <div className="mt-4 text-sm font-semibold text-app-primary">{error}</div> : null}

      <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card mb-4 overflow-hidden break-inside-avoid">
                <div className="aspect-[4/3] bg-black/5" />
                <div className="p-4">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="mt-2 h-4 w-56" />
                  <Skeleton className="mt-3 h-10 w-full" />
                </div>
              </div>
            ))
          : items.map((a) => <AnimalCard key={a.id} animal={a} />)}
      </div>

      <div className="mt-6 flex justify-center">
        {canLoadMore ? (
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Загружаем…' : 'Показать ещё'}
          </Button>
        ) : (
          <div className="text-sm text-black/50">Больше объявлений нет</div>
        )}
      </div>
    </div>
  )
}
