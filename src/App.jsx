import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import PostDetailPage from './pages/PostDetailPage'
import ContactPage from './pages/ContactPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import MessagesPage from './pages/admin/MessagesPage'
import UsersPage from './pages/admin/UsersPage'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/users/login" replace />
  }
  
  if (adminOnly && !['admin', 'super_admin'].includes(user?.type)) {
    return <Navigate to="/home" replace />
  }
  
  return children
}

// Public Route - redirect to home if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/users/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/users/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      <Route path="/contactus" element={<ContactPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Protected Routes */}
      <Route element={<Layout />}>
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/users/:id/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/posts/:id" element={
          <ProtectedRoute>
            <PostDetailPage />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/messages" element={
          <ProtectedRoute adminOnly>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/users/login" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default App
