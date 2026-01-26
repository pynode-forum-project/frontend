import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FiHome, FiUser, FiMail, FiUsers, FiLogOut, FiMessageCircle, FiAlertCircle } from 'react-icons/fi'
import Avatar from './Avatar'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin, isActive } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/users/login')
  }

  return (
    <nav className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/home" 
            className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent"
          >
            Forum
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="flex items-center gap-6">
              <Link
                to="/home"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <FiHome className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              <Link
                to={`/users/${user?.userId}/profile`}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <FiUser className="w-5 h-5" />
                <span className="hidden sm:inline">Profile</span>
              </Link>

              <Link
                to="/contactus"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <FiMessageCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Contact</span>
              </Link>

              {/* Admin Links */}
              {isAdmin() && (
                <>
                  <Link
                    to="/messages"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <FiMail className="w-5 h-5" />
                    <span className="hidden sm:inline">Messages</span>
                  </Link>

                  <Link
                    to="/users"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <FiUsers className="w-5 h-5" />
                    <span className="hidden sm:inline">Users</span>
                  </Link>
                </>
              )}

              {/* User Info & Logout */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                <div className="flex items-center gap-2">
                  <Avatar
                    profileImageUrl={user?.profileImageUrl}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    size="w-8 h-8"
                  />
                  <span className="text-gray-300 hidden md:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                  {!isActive() && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      Banned
                    </span>
                  )}
                  {user?.type === 'unverified' && isActive() && (
                    <Link
                      to="/verify-email"
                      className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full hover:bg-yellow-500/30 transition-colors cursor-pointer"
                    >
                      Verify Email
                    </Link>
                  )}
                  {['admin', 'super_admin'].includes(user?.type) && isActive() && (
                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
