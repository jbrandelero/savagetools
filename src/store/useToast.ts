import { create } from 'zustand'

interface ToastState {
  message: string | null
  /** Bumped each time so the same message re-triggers the auto-hide timer. */
  nonce: number
  show: (message: string) => void
  hide: () => void
}

export const useToast = create<ToastState>((set, get) => ({
  message: null,
  nonce: 0,
  show: (message) => set({ message, nonce: get().nonce + 1 }),
  hide: () => set({ message: null }),
}))
