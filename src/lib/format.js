import { format, formatDistanceToNowStrict } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDateShort(date) {
  try {
    return format(new Date(date), 'dd.MM.yyyy', { locale: ru })
  } catch {
    return ''
  }
}

export function daysAgo(date) {
  try {
    return formatDistanceToNowStrict(new Date(date), { locale: ru, addSuffix: true })
  } catch {
    return ''
  }
}

export function getDistrict(address) {
  if (!address) return ''
  const first = String(address).split(',')[0]
  return first?.trim() ?? ''
}

export function speciesIcon(species) {
  if (species === 'dog') return '🐶'
  if (species === 'cat') return '🐱'
  return '🐾'
}

export function normalizePhone(phone) {
  return String(phone ?? '').replace(/\s+/g, '').trim()
}
