import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'

import { fetchAnimalById, fetchNearbyAnimals, resolveAnimal } from '../lib/animals'
import { animalDivIcon } from '../components/map/markers'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDateShort, getDistrict, speciesIcon } from '../lib/format'
import { useAuth } from '../components/AuthProvider'
import { AnimalCard } from '../components/AnimalCard'

export function AnimalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [animal, setAnimal] = useState(null)
  const [nearby, setNearby] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showContact, setShowContact] = useState(false)
  const [resolving, setResolving] = useState(false)

  const district = getDistrict(animal?.address)
  const canResolve = useMemo(() => {
    if (!animal) return false
    if (animal.status === 'resolved') return false
    if (!user) return false
    return animal.user_id && animal.user_id === user.id
  }, [animal, user])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const a = await fetchAnimalById(id, { incrementViews: true })
        if (!a) {
          setError('Объявление не найдено')
          setLoading(false)
          return
        }
        if (cancelled) return
        setAnimal(a)

        const near = await fetchNearbyAnimals(a.lat, a.lng, a.species, 5)
        if (cancelled) return
        setNearby(near.filter((x) => x.id !== a.id).slice(0, 6))
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
  }, [id])

  async function onResolve() {
    if (!animal) return
    setResolving(true)
    setError('')

    try {
      await resolveAnimal(animal.id)
      setAnimal((prev) => ({ ...prev, status: 'resolved' }))
    } catch (e) {
      setError(e?.message ?? 'Не удалось обновить статус')
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="card overflow-hidden">
          <div className="aspect-[16/9] bg-black/5" />
          <div className="p-6">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-app py-10">
        <div className="card p-6">
          <div className="text-sm font-semibold text-app-primary">{error}</div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/feed')}>
              Вернуться в ленту
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!animal) return null

  return (
    <div className="container-app py-8">
      <div className="card overflow-hidden">
        <div className="relative">
          <div className="aspect-[16/9] bg-black/5 md:aspect-[21/9]">
            {animal.photo_url ? (
              <img src={animal.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-7xl">🐾</div>
            )}
          </div>

          <div className="absolute left-4 top-4 flex gap-2">
            <Badge kind={animal.type} />
            <Badge kind={animal.status} />
          </div>

          <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-4 py-2 text-xs font-bold text-black/70 backdrop-blur">
            👁 {animal.views ?? 0}
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="text-2xl font-extrabold md:text-3xl">
              {speciesIcon(animal.species)} {animal.species === 'dog' ? 'Собака' : animal.species === 'cat' ? 'Кошка' : 'Животное'}
            </h1>

            <div className="mt-3 grid gap-2 text-sm text-black/70 md:grid-cols-2">
              <div>
                <span className="font-bold text-black/80">Порода:</span> {animal.breed || '—'}
              </div>
              <div>
                <span className="font-bold text-black/80">Окрас:</span> {animal.color}
              </div>
              <div>
                <span className="font-bold text-black/80">Район:</span> {district || 'Актобе'}
              </div>
              <div>
                <span className="font-bold text-black/80">Дата:</span> {formatDateShort(animal.created_at)}
              </div>
            </div>

            <div className="mt-5 rounded-card border border-app-border bg-white p-5">
              <div className="text-sm font-extrabold">Описание</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-black/80">{animal.description}</div>
              <div className="mt-3 text-xs text-black/50">Адрес: {animal.address}</div>
            </div>

            <div className="mt-5 overflow-hidden rounded-card border border-app-border">
              <div className="h-64">
                <MapContainer center={[animal.lat, animal.lng]} zoom={14} className="h-full w-full" dragging={false} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[animal.lat, animal.lng]} icon={animalDivIcon(animal.type)} />
                </MapContainer>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-5">
              <div className="text-sm font-extrabold">Контакт</div>
              <div className="mt-2 text-sm text-black/70">{animal.contact_name || '—'}</div>

              {showContact ? (
                <div className="mt-3 rounded-2xl bg-black/5 p-4 text-sm font-bold">
                  📞 {animal.contact_phone}
                </div>
              ) : (
                <div className="mt-4">
                  <Button variant="outline" className="w-full" onClick={() => setShowContact(true)}>
                    Показать контакт
                  </Button>
                </div>
              )}

              {canResolve ? (
                <div className="mt-4">
                  <Button variant="secondary" className="w-full" onClick={onResolve} disabled={resolving}>
                    {resolving ? 'Обновляем…' : 'Животное найдено/вернулось домой'}
                  </Button>
                </div>
              ) : null}

              {error ? <div className="mt-3 text-sm font-semibold text-app-primary">{error}</div> : null}
            </div>

            {nearby.length ? (
              <div className="mt-6">
                <div className="mb-3 text-sm font-extrabold">Похожие рядом (до 5 км)</div>
                <div className="columns-1 gap-4">
                  {nearby.slice(0, 3).map((a) => (
                    <AnimalCard key={a.id} animal={a} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
