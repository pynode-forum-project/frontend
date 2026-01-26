import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authAPI, userAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { FiMail, FiCheck } from 'react-icons/fi'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const { user, login, pendingEmail, clearPendingEmail, updateUser, setPendingEmail } = useAuthStore()
  const [code, setCode] = useState('')
  const userId = user?.userId

  const { data: profileData } = useQuery({
    queryKey: ['user', userId, 'verify-email'],
    queryFn: () => userAPI.getById(userId),
    enabled: !!userId,
  })

  const profileUser = profileData?.data?.user
  const profilePendingEmail = profileUser?.pendingEmail
  const targetEmail = pendingEmail || profilePendingEmail || user?.pendingEmail || user?.email

  useEffect(() => {
    if (!profileUser) {
      return
    }

    if (!user || user.pendingEmail !== profileUser.pendingEmail || user.email !== profileUser.email) {
      updateUser(profileUser)
    }
    if (profileUser.pendingEmail && profileUser.pendingEmail !== pendingEmail) {
      setPendingEmail(profileUser.pendingEmail)
    } else if (!profileUser.pendingEmail && pendingEmail) {
      clearPendingEmail()
    }
  }, [profileUser, user, updateUser, setPendingEmail, clearPendingEmail, pendingEmail])

  const verifyMutation = useMutation({
    mutationFn: () => authAPI.verifyEmail(targetEmail, code),
    onSuccess: (response) => {
      const { token, user: updatedUser } = response.data
      // Update token and user info with new JWT token
      login(token, updatedUser)
      clearPendingEmail()
      toast.success('Email verified successfully!')
      navigate('/home')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Verification failed')
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authAPI.resendVerification(targetEmail),
    onSuccess: () => {
      toast.success('Verification code sent!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to resend code')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!targetEmail) {
      toast.error('No email available for verification')
      return
    }
    if (code.length === 6) {
      verifyMutation.mutate()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="card p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiMail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-400">
              We've sent a 6-digit code to<br />
              <span className="text-primary-400">{targetEmail}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2 text-center">
                Enter Verification Code
              </label>
              <input
                type="text"
                className="input-field text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={!targetEmail || code.length !== 6 || verifyMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {verifyMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck />
                  Verify Email
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 mb-2">Didn't receive the code?</p>
            <button
              onClick={() => resendMutation.mutate()}
              disabled={!targetEmail || resendMutation.isPending}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              {resendMutation.isPending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/home')}
              className="text-gray-500 hover:text-gray-400 text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
