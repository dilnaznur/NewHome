export function Skeleton({ className = '' }) {
  return <div className={['animate-pulse rounded bg-black/10', className].join(' ')} />
}
