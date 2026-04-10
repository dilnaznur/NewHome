import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'

import { HomePage } from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { FeedPage } from './pages/FeedPage'
import { PostPage } from './pages/PostPage'
import { AnimalDetailPage } from './pages/AnimalDetailPage'
import { AuthPage } from './pages/AuthPage'
import { MyPostsPage } from './pages/MyPostsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route
          path="/post"
          element={
            <RequireAuth>
              <PostPage />
            </RequireAuth>
          }
        />
        <Route path="/animal/:id" element={<AnimalDetailPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/my"
          element={
            <RequireAuth>
              <MyPostsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
