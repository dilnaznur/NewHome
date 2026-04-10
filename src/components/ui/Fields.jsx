export function Label({ children }) {
  return <div className="mb-1 text-sm font-bold text-black/80">{children}</div>
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={[
        'w-full rounded-2xl border border-app-border bg-white px-4 py-3 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={[
        'w-full rounded-2xl border border-app-border bg-white px-4 py-3 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={[
        'w-full appearance-none rounded-2xl border border-app-border bg-white px-4 py-3 text-sm outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/5',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </select>
  )
}
