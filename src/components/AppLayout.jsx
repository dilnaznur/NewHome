import { NavLink, Outlet } from 'react-router-dom'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-full px-3 py-2 text-sm font-semibold transition',
          isActive ? 'bg-black/5' : 'hover:bg-black/5',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-app-border bg-app-bg/80 backdrop-blur">
        <div className="container-app flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-black/5">🐾</div>
              <div className="leading-tight">
                <div className="font-heading text-base font-extrabold tracking-tight">Табылды</div>
                <div className="text-xs text-black/60">Актобе • lost & found</div>
              </div>
            </NavLink>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/feed">Лента</NavItem>
            <NavItem to="/map">Карта</NavItem>
            <NavItem to="/post">Подать объявление</NavItem>
            <NavItem to="/my">Мои</NavItem>
          </nav>

          <div className="flex items-center gap-2">
            <NavLink
              to="/post"
              className="hidden rounded-full bg-app-primary px-4 py-2 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow md:inline-block"
            >
              + Объявление
            </NavLink>
          </div>
        </div>

        <div className="border-t border-app-border md:hidden">
          <div className="container-app flex items-center justify-between gap-2 py-2 text-xs font-semibold">
            <NavItem to="/feed">Лента</NavItem>
            <NavItem to="/map">Карта</NavItem>
            <NavItem to="/post">Подать</NavItem>
            <NavItem to="/my">Мои</NavItem>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-app-border">
        <div className="container-app py-8 text-sm text-black/60">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              Сделано с заботой для сообщества Актобе. <span className="text-black/40">🐾</span>
            </div>
            <div className="text-black/40">Не публикуйте личные данные кроме контакта.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
