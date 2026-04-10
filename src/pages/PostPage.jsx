import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'

import { useAuth } from '../components/AuthProvider'
import { Button } from '../components/ui/Button'
import { Input, Label, Select, Textarea } from '../components/ui/Fields'
import { Badge } from '../components/ui/Badge'
import { ClickToSetMarker } from '../components/map/ClickToSetMarker'
import {
  createAnimalPost,
  fetchAnimalById,
  updateAnimalPost,
  uploadAnimalPhoto,
} from '../lib/animals'
import { normalizePhone, speciesIcon } from '../lib/format'

const AKTOBE = { lat: 50.2839, lng: 57.1664 }

const TYPE_OPTIONS = [
  { key: 'lost', title: 'Я потерял питомца', hint: '🔴 Потерян' },
  { key: 'found', title: 'Я нашёл животное', hint: '🟢 Найден' },
  { key: 'stray', title: 'Просто бездомное', hint: '🟠 Бездомный' },
]

const SPECIES_OPTIONS = [
  { key: 'dog', title: 'Собака', icon: '🐶' },
  { key: 'cat', title: 'Кошка', icon: '🐱' },
  { key: 'other', title: 'Другое', icon: '🐾' },
]

const COLOR_SWATCHES = [
  { label: 'Белый', value: 'белый', className: 'bg-white' },
  { label: 'Чёрный', value: 'чёрный', className: 'bg-black' },
  { label: 'Серый', value: 'серый', className: 'bg-zinc-400' },
  { label: 'Рыжий', value: 'рыжий', className: 'bg-orange-400' },
  { label: 'Коричневый', value: 'коричневый', className: 'bg-amber-800' },
  { label: 'Пятнистый', value: 'пятнистый', className: 'bg-gradient-to-br from-white via-zinc-300 to-black' },
]

function StepPill({ index, current, label }) {
  const active = index === current
  const done = index < current
  return (
    <div
      className={[
        'flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold',
        active ? 'border-black/20 bg-black/5' : 'border-app-border bg-white',
        done ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className="grid h-5 w-5 place-items-center rounded-full bg-black/10 text-[11px]">{index + 1}</div>
      {label}
    </div>
  )
}

export function PostPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const editId = params.get('edit')
  const preType = params.get('type')

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState(preType === 'lost' || preType === 'found' || preType === 'stray' ? preType : '')
  const [species, setSpecies] = useState('dog')
  const [breed, setBreed] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState('')

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  const [location, setLocation] = useState({ lat: null, lng: null })
  const [address, setAddress] = useState('')

  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const [successId, setSuccessId] = useState('')

  const initialLoaded = useRef(false)

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  useEffect(() => {
    if (!editId || initialLoaded.current) return

    let cancelled = false

    async function loadExisting() {
      try {
        const existing = await fetchAnimalById(editId, { incrementViews: false })
        if (!existing) return
        if (cancelled) return

        if (existing.user_id && existing.user_id !== user?.id) {
          setError('Вы не можете редактировать это объявление')
          return
        }

        setType(existing.type)
        setSpecies(existing.species)
        setBreed(existing.breed || '')
        setColor(existing.color || '')
        setDescription(existing.description || '')
        setPhotoUrl(existing.photo_url || '')
        setPhotoPreview(existing.photo_url || '')
        setLocation({ lat: existing.lat, lng: existing.lng })
        setAddress(existing.address || '')
        setContactName(existing.contact_name || '')
        setContactPhone(existing.contact_phone || '')
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Не удалось загрузить объявление')
      } finally {
        initialLoaded.current = true
      }
    }

    loadExisting()

    return () => {
      cancelled = true
    }
  }, [editId, user?.id])

  const shareUrl = useMemo(() => {
    if (!successId) return ''
    return `${window.location.origin}/animal/${successId}`
  }, [successId])

  function next() {
    setError('')

    if (step === 0 && !type) return setError('Выберите тип объявления')
    if (step === 1) {
      if (!species) return setError('Выберите вид')
      if (!color) return setError('Выберите или укажите окрас')
      if (!description.trim()) return setError('Добавьте описание')
    }
    if (step === 2) {
      if (!photoFile && !photoUrl) return setError('Добавьте фото')
    }
    if (step === 3) {
      if (!location.lat || !location.lng) return setError('Поставьте точку на карте')
      if (!address.trim()) return setError('Укажите адрес текстом')
    }
    if (step === 4) {
      if (!contactName.trim()) return setError('Укажите имя')
      if (!normalizePhone(contactPhone)) return setError('Укажите телефон')
    }

    setStep((s) => Math.min(s + 1, 5))
  }

  function back() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function detectLocation() {
    setError('')
    if (!navigator.geolocation) {
      setError('Геолокация недоступна в этом браузере')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setError('Не удалось получить геолокацию')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  async function submit() {
    setSaving(true)
    setError('')

    try {
      let finalPhotoUrl = photoUrl
      if (photoFile) {
        finalPhotoUrl = await uploadAnimalPhoto(photoFile)
      }

      const payload = {
        type,
        status: 'active',
        species,
        breed: breed || null,
        color,
        description,
        lat: Number(location.lat),
        lng: Number(location.lng),
        address,
        photo_url: finalPhotoUrl,
        contact_phone: normalizePhone(contactPhone),
        contact_name: contactName,
        user_id: user.id,
      }

      if (editId) {
        await updateAnimalPost(editId, payload)
        setSuccessId(editId)
      } else {
        const created = await createAnimalPost(payload)
        setSuccessId(created.id)
      }

      setStep(6)
    } catch (e) {
      setError(e?.message ?? 'Не удалось отправить')
    } finally {
      setSaving(false)
    }
  }

  if (step === 6 && successId) {
    const shareText = `Табылды: объявление о животном в Актобе — ${shareUrl}`

    async function copyLink() {
      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        // ignore
      }
    }

    return (
      <div className="container-app py-10">
        <div className="mx-auto max-w-2xl">
          <div className="card p-6 md:p-10">
            <div className="text-5xl">🎉</div>
            <h1 className="mt-3 text-3xl font-extrabold">Готово!</h1>
            <p className="mt-2 text-sm text-black/60">
              Спасибо. Чем больше людей увидят пост — тем выше шанс найти хозяев.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <a
                className="rounded-2xl border border-app-border bg-white px-4 py-3 text-center text-sm font-extrabold transition hover:-translate-y-0.5"
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="rounded-2xl border border-app-border bg-white px-4 py-3 text-center text-sm font-extrabold transition hover:-translate-y-0.5"
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Табылды — помогите распространить!')}`}
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-2xl border border-app-border bg-white px-4 py-3 text-sm font-extrabold transition hover:-translate-y-0.5"
              >
                Скопировать ссылку
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="primary" onClick={() => navigate(`/animal/${successId}`)}>
                Открыть объявление
              </Button>
              <Button variant="outline" onClick={() => navigate('/feed')}>
                Перейти в ленту
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">{editId ? 'Редактировать' : 'Подать объявление'}</h1>
            <div className="mt-1 text-sm text-black/60">Шаг {Math.min(step + 1, 6)} из 6 • Сделано с заботой 🐾</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StepPill index={0} current={step} label="Тип" />
            <StepPill index={1} current={step} label="Детали" />
            <StepPill index={2} current={step} label="Фото" />
            <StepPill index={3} current={step} label="Место" />
            <StepPill index={4} current={step} label="Контакт" />
            <StepPill index={5} current={step} label="Проверка" />
          </div>
        </div>

        {error ? <div className="mt-4 text-sm font-semibold text-app-primary">{error}</div> : null}

        <div className="card mt-5 p-5 md:p-7">
          {step === 0 ? (
            <div>
              <div className="text-sm font-extrabold">Шаг 1 — Выберите тип</div>
              <div className="mt-4 grid gap-3">
                {TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setType(o.key)}
                    className={[
                      'rounded-card border px-5 py-4 text-left transition',
                      type === o.key ? 'border-black/20 bg-black/5' : 'border-app-border bg-white hover:bg-black/5',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-base font-extrabold">{o.title}</div>
                      <Badge kind={o.key} />
                    </div>
                    <div className="mt-1 text-sm text-black/60">{o.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <div className="text-sm font-extrabold">Шаг 2 — Детали</div>

              <div className="mt-4">
                <Label>Вид</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SPECIES_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setSpecies(o.key)}
                      className={[
                        'rounded-2xl border border-app-border bg-white px-4 py-3 text-left text-sm font-extrabold transition',
                        species === o.key ? 'bg-black/5 border-black/20' : 'hover:bg-black/5',
                      ].join(' ')}
                    >
                      <div className="text-xl">{o.icon}</div>
                      <div className="mt-1">{o.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Порода (необязательно)</Label>
                  <Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Например, алабай" />
                </div>
                <div>
                  <Label>Окрас</Label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Например, белый с чёрным" />
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-2 text-xs font-bold text-black/60">Быстрый выбор</div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((s) => (
                    <button
                      type="button"
                      key={s.value}
                      onClick={() => setColor(s.value)}
                      className={[
                        'flex items-center gap-2 rounded-full border border-app-border bg-white px-3 py-2 text-xs font-extrabold transition hover:-translate-y-0.5',
                        color === s.value ? 'border-black/20' : '',
                      ].join(' ')}
                    >
                      <span className={['h-4 w-4 rounded-full border border-black/10', s.className].join(' ')} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label>Описание</Label>
                <Textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите животное: особенности, ошейник, поведение, куда убежал/где видели…"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <div className="text-sm font-extrabold">Шаг 3 — Фото</div>
              <div className="mt-3 text-sm text-black/60">Загрузите одно фото (до 5MB). Чем лучше видно — тем выше шанс.</div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Файл</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm"
                  />

                  {(photoFile || photoUrl) ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhotoFile(null)
                          setPhotoPreview(photoUrl)
                        }}
                      >
                        Убрать новый файл
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label>Предпросмотр</Label>
                  <div className="overflow-hidden rounded-card border border-app-border bg-black/5">
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center text-5xl">🐾</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <div className="text-sm font-extrabold">Шаг 4 — Место</div>
              <div className="mt-3 text-sm text-black/60">Кликните по карте, чтобы поставить точку. Или используйте геолокацию.</div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label>Адрес</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Например: Актобе, 11 мкр, дом 25" />
                </div>
                <Button variant="outline" onClick={detectLocation}>
                  Определить геолокацию
                </Button>
              </div>

              <div className="mt-4 overflow-hidden rounded-card border border-app-border">
                <div className="h-80">
                  <MapContainer
                    center={[location.lat ?? AKTOBE.lat, location.lng ?? AKTOBE.lng]}
                    zoom={location.lat ? 14 : 12}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickToSetMarker value={location} onChange={setLocation} type={type || 'lost'} />
                  </MapContainer>
                </div>
              </div>

              {location.lat ? (
                <div className="mt-3 text-xs text-black/60">
                  Координаты: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <div className="text-sm font-extrabold">Шаг 5 — Контакт</div>
              <div className="mt-3 text-sm text-black/60">Контакт показывается только после клика «Показать контакт».</div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Имя</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Например, Айгүл" />
                </div>
                <div>
                  <Label>Телефон</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+7 777 123 45 67" />
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <div className="text-sm font-extrabold">Шаг 6 — Проверка</div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-app-border bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-extrabold">Объявление</div>
                    <Badge kind={type} />
                  </div>

                  <div className="mt-3 text-sm text-black/70">
                    <div className="font-bold text-black/80">{speciesIcon(species)} {species === 'dog' ? 'Собака' : species === 'cat' ? 'Кошка' : 'Другое'}</div>
                    <div className="mt-1">Порода: {breed || '—'}</div>
                    <div>Окрас: {color || '—'}</div>
                    <div className="mt-2 whitespace-pre-wrap">{description}</div>
                  </div>
                </div>

                <div className="rounded-card border border-app-border bg-white p-5">
                  <div className="text-sm font-extrabold">Место и контакт</div>
                  <div className="mt-3 text-sm text-black/70">
                    <div>Адрес: {address}</div>
                    <div className="mt-1 text-xs text-black/50">
                      Коорд.: {location.lat?.toFixed?.(5)}, {location.lng?.toFixed?.(5)}
                    </div>
                    <div className="mt-3">Имя: {contactName}</div>
                    <div>Телефон: {normalizePhone(contactPhone)}</div>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0 || saving}>
            ← Назад
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/feed')}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              variant={step === 5 ? 'secondary' : 'primary'}
              onClick={step === 5 ? submit : next}
              disabled={saving}
            >
              {step === 5 ? (editId ? 'Сохранить' : 'Отправить') : 'Далее →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
