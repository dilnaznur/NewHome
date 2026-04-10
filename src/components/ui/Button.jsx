export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }

  const variants = {
    primary: 'bg-app-primary text-white shadow-soft hover:-translate-y-0.5',
    secondary: 'bg-app-secondary text-white shadow-soft hover:-translate-y-0.5',
    outline:
      'border border-app-border bg-white text-app-text hover:-translate-y-0.5',
    ghost: 'bg-transparent text-app-text hover:bg-black/5',
    danger: 'bg-app-primary text-white shadow-soft hover:-translate-y-0.5',
  }

  return (
    <button
      type={type}
      className={[base, sizes[size], variants[variant], className].join(' ')}
      {...props}
    />
  )
}
