import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { messageAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { FiMail, FiMessageSquare, FiSend, FiArrowLeft, FiCheck } from 'react-icons/fi'

const ContactPage = () => {
  const { user, isAuthenticated } = useAuthStore()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    subject: '',
    message: '',
  })

  const submitMutation = useMutation({
    mutationFn: () => messageAPI.create(formData),
    onSuccess: () => {
      setSubmitted(true)
      toast.success('Message sent successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send message')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.email || !formData.subject || !formData.message) {
      toast.error('All fields are required')
      return
    }
    submitMutation.mutate()
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Message Sent!</h1>
          <p className="text-gray-400 mb-6">
            Thank you for contacting us. An admin will review your message soon.
          </p>
          <Link to={isAuthenticated ? '/home' : '/users/login'} className="btn-primary inline-flex items-center gap-2">
            <FiArrowLeft />
            {isAuthenticated ? 'Back to Home' : 'Go to Login'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Back link */}
        <Link
          to={isAuthenticated ? '/home' : '/users/login'}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiArrowLeft />
          Back
        </Link>

        <div className="card p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Contact Admin</h1>
            <p className="text-gray-400">
              Have a question or need help? Send us a message.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-12"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="What's this about?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                className="input-field min-h-[150px] resize-y"
                placeholder="Tell us more..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSend />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
