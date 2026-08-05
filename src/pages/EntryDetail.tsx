import { Link, useParams } from 'react-router-dom'
import { EntryView } from '@/components/EntryView'
import { useT } from '@/hooks'

/** Standalone detail route — used by omnisearch and shareable links. */
export function EntryDetail() {
  const { key = '' } = useParams<{ key: string }>()
  const { t } = useT()
  return (
    <div className="space-y-4">
      <Link to="/browse" className="text-sm text-blood hover:underline">
        ← {t.nav.browse}
      </Link>
      <EntryView entryKey={decodeURIComponent(key)} />
    </div>
  )
}
