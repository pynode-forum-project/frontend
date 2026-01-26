import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
      },

      updateUser: (userData) => {
        set({
          user: { ...get().user, ...userData },
        })
      },

      isAdmin: () => {
        const user = get().user
        return user && ['admin', 'super_admin'].includes(user.type)
      },

      isSuperAdmin: () => {
        const user = get().user
        return user && user.type === 'super_admin'
      },

      isVerified: () => {
        const user = get().user
        return user && user.type !== 'unverified'
      },

      isActive: () => {
        const user = get().user
        return user && user.active !== false
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
