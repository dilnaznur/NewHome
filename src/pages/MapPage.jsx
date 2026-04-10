import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useNavigate } from 'react-router-dom'

import { fetchActiveAnimals } from '../lib/animals'
import { animalDivIcon } from '../components/map/markers'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Fields'

const AKTOBE = { lat: 50.2839, lng: 57.1664 }

export function MapPage() {
  const navigate = useNavigate()

  const [types, setTypes] = useState({ lost: true, found: true, stray: true })
  const [species, setSpecies] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const typeFilter = useMemo(() => {
    const enabled = Object.entries(types)
      .filter(([, v]) => v)
      .map(([k]) => k)

    if (enabled.length === 3) return null
    return enabled
  }, [types])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        // Supabase doesn't do OR filtering easily with our helper, so fetch a larger set
        // and filter client-side when multiple types are selected.
        const res = await fetchActiveAnimals({
          species,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: 0,
          pageSize: 500,
          sort: 'new',
        })

        const filtered = typeFilter
          ? res.items.filter((a) => typeFilter.includes(a.type))
          : res.items

        if (cancelled) return
        setItems(filtered)
      } catch (e) {
        if (cancelled) return
        setError(e?.message ?? 'Ошибка загрузки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [species, dateFrom, dateTo, typeFilter])

  function toggleType(key) {
    setTypes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="relative">
      <div className="h-[calc(100dvh-140px)] md:h-[calc(100dvh-72px)]">
        <MapContainer center={AKTOBE} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup chunkedLoading>
            {items.map((a) => (
              <Marker key={a.id} position={[a.lat, a.lng]} icon={animalDivIcon(a.type)}>
                <Popup>
                  <div className="w-64">
                    <div className="flex items-start justify-between gap-2">
                      <Badge kind={a.type} />
                      <Badge kind={a.status} />
                    </div>

                    <div className="mt-2 overflow-hidden rounded-2xl bg-black/5">
                      {a.photo_url ? (
                        <img src={a.photo_url} alt="" className="h-28 w-full object-cover" />
                      ) : (
                        <div className="grid h-28 place-items-center text-3xl">🐾</div>
                      )}
                    </div>

                    <div className="mt-2 text-sm font-bold text-black/80">{a.description}</div>

                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/animal/${a.id}`)}>
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <aside className="pointer-events-none absolute left-0 top-0 z-30 w-full">
        <div className="container-app pointer-events-auto pt-4">
          <div className="card max-w-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold">Фильтры</div>
                <div className="text-xs text-black/60">{loading ? 'Загрузка…' : `На карте: ${items.length}`}</div>
              </div>
              <div className="text-2xl opacity-20">🗺️</div>
            </div>

            {error ? <div className="mt-3 text-sm font-semibold text-app-primary">{error}</div> : null}

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-xs font-bold text-black/70">Тип</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => toggleType('lost')}
                    className={[
                      'rounded-2xl border border-app-border px-3 py-2 text-left transition',
                      types.lost ? 'bg-badge-lost/15' : 'bg-white',
                    ].join(' ')}
                  >
                    🔴 Потерян
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleType('found')}
                    className={[
                      'rounded-2xl border border-app-border px-3 py-2 text-left transition',
                      types.found ? 'bg-badge-found/15' : 'bg-white',
                    ].join(' ')}
                  >
                    🟢 Найден
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleType('stray')}
                    className={[
                      'rounded-2xl border border-app-border px-3 py-2 text-left transition',
                      types.stray ? 'bg-badge-stray/20' : 'bg-white',
                    ].join(' ')}
                  >
                    🟠 Бездомный
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-black/70">Вид</div>
                <div className="mt-2">
                  <Select value={species} onChange={(e) => setSpecies(e.target.value)}>
                    <option value="all">Все</option>
                    <option value="dog">Собака</option>
                    <option value="cat">Кошка</option>
                    <option value="other">Другое</option>
                  </Select>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-black/70">Дата</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-app-border bg-white px-3 py-2 text-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-app-border bg-white px-3 py-2 text-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
