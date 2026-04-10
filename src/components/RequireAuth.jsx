import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="card p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-black/10" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-black/10" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-black/10" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
