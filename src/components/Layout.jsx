import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { userAPI } from '../services/api'
import toast from 'react-hot-toast'
import Navbar from './Navbar'

const Layout = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, token } = useAuthStore()

  // Check user status on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.userId && token) {
      // Make a lightweight request to verify user status
      userAPI.getById(user.userId)
        .then((response) => {
          const userData = response.data.user
          // If user is banned, force logout
          if (userData.active === false) {
            logout()
            toast.error('Your account has been banned. Please contact admin.')
            navigate('/users/login')
            return
          }
          // If user type changed (promoted/demoted), force logout
          if (userData.type !== user.type) {
            logout()
            toast.error('Your account role has been changed. Please log in again.')
            navigate('/users/login')
            return
          }
        })
        .catch((error) => {
          // If 403 error (banned or role changed), logout is handled by interceptor
          // If other errors, just log them
          if (error.response?.status !== 403) {
            console.error('Failed to verify user status:', error)
          }
        })
    }
  }, [isAuthenticated, user?.userId, user?.type, token, logout, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
