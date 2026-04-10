const LABELS = {
  lost: '🔴 ПОТЕРЯН',
  found: '🟢 НАЙДЕН',
  stray: '🟠 БЕЗДОМНЫЙ',
  active: 'Активно',
  resolved: 'Решено',
}

export function Badge({ kind = 'active', className = '' }) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold'

  const styles = {
    lost: 'bg-badge-lost/15 text-badge-lost',
    found: 'bg-badge-found/15 text-badge-found',
    stray: 'bg-badge-stray/20 text-black/80',
    active: 'bg-black/5 text-black/70',
    resolved: 'bg-black/10 text-black/70',
  }

  return <span className={[base, styles[kind] ?? styles.active, className].join(' ')}>{LABELS[kind] ?? kind}</span>
}
