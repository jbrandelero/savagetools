import { useEffect } from 'react'
import { useToast } from '@/store/useToast'

/** Renders the current toast, auto-hiding after a short delay. */
export function Toaster() {
  const message = useToast((s) => s.message)
  const nonce = useToast((s) => s.nonce)
  const hide = useToast((s) => s.hide)

  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(hide, 2200)
    return () => window.clearTimeout(id)
  }, [message, nonce, hide])

  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto rounded-full bg-blood px-4 py-2 text-sm text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}
