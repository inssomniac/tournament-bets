import { create } from 'zustand'

export interface User {
  id: number
  telegram_id: number
  full_name: string
  balance: number
}

interface AppStore {
  token: string | null
  user: User | null
  isAdmin: boolean
  setToken: (token: string) => void
  setUser: (user: User) => void
  setAdmin: (isAdmin: boolean) => void
  updateBalance: (balance: number) => void
  reset: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  token: null,
  user: null,
  isAdmin: false,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setAdmin: (isAdmin) => set({ isAdmin }),
  updateBalance: (balance) =>
    set((s) => ({ user: s.user ? { ...s.user, balance } : null })),
  reset: () => set({ token: null, user: null, isAdmin: false }),
}))
