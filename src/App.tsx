import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Browse } from '@/pages/Browse'
import { EntryDetail } from '@/pages/EntryDetail'
import { Books } from '@/pages/Books'
import { Favorites } from '@/pages/Favorites'
import { useLibrary } from '@/store/useLibrary'
import { useT } from '@/hooks'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'browse', element: <Browse /> },
      { path: 'browse/:type', element: <Browse /> },
      { path: 'entry/:key', element: <EntryDetail /> },
      { path: 'favorites', element: <Favorites /> },
      { path: 'books', element: <Books /> },
    ],
  },
])

export function App() {
  const init = useLibrary((s) => s.init)
  const status = useLibrary((s) => s.status)
  const error = useLibrary((s) => s.error)
  const theme = useLibrary((s) => s.theme)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (status === 'error') {
    return <LoadError error={error} />
  }

  return <RouterProvider router={router} />
}

function LoadError({ error }: { error?: string }) {
  const { t } = useT()
  return (
    <div className="p-6 text-red-600">
      {t.loadError} {error}
    </div>
  )
}
