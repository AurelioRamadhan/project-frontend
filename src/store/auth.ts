import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: 'PM' | 'INTERNAL' | 'CLIENT'
  department: string
}

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  hydrated: false,

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, hydrated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, hydrated: true })
  },

  hydrate: () => {
    const token = localStorage.getItem('token')
    const userRaw = localStorage.getItem('user')
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as User
        set({ user, token, hydrated: true })
        return
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    set({ hydrated: true })
  },
}))