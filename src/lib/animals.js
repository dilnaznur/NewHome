import { supabase } from './supabase'

function firstDayOfMonthIso(date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function fetchActiveAnimals({
  type,
  species,
  color,
  search,
  dateFrom,
  dateTo,
  sort = 'new',
  page = 0,
  pageSize = 12,
} = {}) {
  let query = supabase
    .from('animals')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (type && type !== 'all') query = query.eq('type', type)
  if (species && species !== 'all') query = query.eq('species', species)
  if (color && color !== 'all') query = query.ilike('color', `%${color}%`)
  if (search) query = query.ilike('description', `%${search}%`)

  if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString())
  if (dateTo) query = query.lte('created_at', new Date(dateTo).toISOString())

  if (sort === 'views') query = query.order('views', { ascending: false }).order('created_at', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  return { items: data ?? [], count: count ?? 0 }
}

export async function fetchAnimalById(id, { incrementViews = true } = {}) {
  if (!id) throw new Error('Missing id')

  const { data, error } = await supabase.from('animals').select('*').eq('id', id).maybeSingle()
  if (error) throw error

  if (data && incrementViews) {
    incrementAnimalViews(id).catch(() => {})
  }

  return data
}

export async function incrementAnimalViews(id) {
  // Best-effort: if you create an RPC in Supabase, this will be atomic.
  // Otherwise, fallback to a read+write update.
  const rpc = await supabase.rpc('increment_animal_views', { animal_id: id })
  if (!rpc.error) return

  const current = await supabase.from('animals').select('views').eq('id', id).maybeSingle()
  if (current.error) throw current.error
  const nextViews = (current.data?.views ?? 0) + 1

  const upd = await supabase.from('animals').update({ views: nextViews }).eq('id', id)
  if (upd.error) throw upd.error
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function fetchNearbyAnimals(lat, lng, species, radiusKm = 5) {
  if (lat == null || lng == null) return []

  const latNum = Number(lat)
  const lngNum = Number(lng)
  const r = Number(radiusKm)

  // Bounding box (rough): 1 degree lat ~ 111km
  const dLat = r / 111
  const dLng = r / (111 * Math.cos((latNum * Math.PI) / 180))

  let query = supabase
    .from('animals')
    .select('*')
    .eq('status', 'active')
    .gte('lat', latNum - dLat)
    .lte('lat', latNum + dLat)
    .gte('lng', lngNum - dLng)
    .lte('lng', lngNum + dLng)
    .limit(50)

  if (species) query = query.eq('species', species)

  const { data, error } = await query
  if (error) throw error

  const items = (data ?? [])
    .map((a) => ({ ...a, _distanceKm: haversineKm(latNum, lngNum, a.lat, a.lng) }))
    .filter((a) => a._distanceKm <= r)
    .sort((a, b) => a._distanceKm - b._distanceKm)

  return items
}

export async function uploadAnimalPhoto(file) {
  if (!file) throw new Error('No file')
  if (file.size > 5 * 1024 * 1024) throw new Error('Фото больше 5MB')

  const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const upload = await supabase.storage.from('animal-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })

  if (upload.error) throw upload.error

  const publicUrl = supabase.storage.from('animal-photos').getPublicUrl(upload.data.path)
  return publicUrl.data.publicUrl
}

export async function createAnimalPost(data) {
  const { data: created, error } = await supabase
    .from('animals')
    .insert(data)
    .select('*')
    .single()
  if (error) throw error
  return created
}

export async function updateAnimalPost(id, patch) {
  const { error } = await supabase.from('animals').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteAnimal(id) {
  const { error } = await supabase.from('animals').delete().eq('id', id)
  if (error) throw error
}

export async function resolveAnimal(id) {
  const { error } = await supabase.from('animals').update({ status: 'resolved' }).eq('id', id)
  if (error) throw error
}

export async function getMonthlyStats() {
  const from = firstDayOfMonthIso()

  const [lost, found, reunited] = await Promise.all([
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('type', 'lost').gte('created_at', from),
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('type', 'found').gte('created_at', from),
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', from),
  ])

  if (lost.error) throw lost.error
  if (found.error) throw found.error
  if (reunited.error) throw reunited.error

  return {
    lost: lost.count ?? 0,
    found: found.count ?? 0,
    reunited: reunited.count ?? 0,
  }
}
