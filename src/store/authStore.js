import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      pendingEmail: null,

      login: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
          pendingEmail: user?.pendingEmail ?? null,
        })
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          pendingEmail: null,
        })
      },

      updateUser: (userData) => {
        set({
          user: { ...get().user, ...userData },
        })
      },

      setPendingEmail: (email) => {
        set({
          pendingEmail: email,
        })
      },

      clearPendingEmail: () => {
        set({
          pendingEmail: null,
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
