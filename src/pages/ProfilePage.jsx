import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userAPI, postAPI, historyAPI, fileAPI, authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { FiEdit2, FiCalendar, FiFileText, FiClock, FiUpload, FiX, FiMessageCircle, FiHash, FiCopy, FiChevronLeft, FiChevronRight, FiSearch, FiFilter, FiRotateCcw, FiMail, FiCheck } from 'react-icons/fi'
import Avatar from '../components/Avatar'

const ProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser, updateUser, login } = useAuthStore()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [editData, setEditData] = useState({ firstName: '', lastName: '', email: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const historyPerPage = 10
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const isOwnProfile = String(currentUser?.userId) === id

  // Fetch user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userAPI.getById(id),
  })

  // Fetch user's top posts
  const { data: topPostsData } = useQuery({
    queryKey: ['topPosts', id],
    queryFn: () => postAPI.getUserTopPosts(id),
    enabled: !!id,
  })

  // Fetch drafts (only for own profile)
  const { data: draftsData } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => postAPI.getDrafts(),
    enabled: isOwnProfile,
  })

  // Fetch history (only for own profile)
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['history', id, historyPage, isSearching, searchKeyword, searchDate],
    queryFn: () => {
      if (isSearching && (searchKeyword || searchDate)) {
        return historyAPI.search(id, { keyword: searchKeyword || undefined, date: searchDate || undefined })
      }
      return historyAPI.getUserHistory(id, { page: historyPage, limit: historyPerPage })
    },
    enabled: isOwnProfile,
  })

  const user = userData?.data?.user
  const topPosts = topPostsData?.data?.posts || []
  const drafts = draftsData?.data?.posts || []
  const history = historyData?.data?.histories || []
  const historyTotalPages = isSearching ? 1 : (historyData?.data?.totalPages || 1)
  const historyTotal = isSearching ? history.length : (historyData?.data?.total || 0)

  // Handle search
  const handleSearch = () => {
    if (!searchKeyword && !searchDate) {
      toast.error('Please enter a keyword or select a date')
      return
    }
    setIsSearching(true)
    setHistoryPage(1)
  }

  // Handle reset
  const handleResetSearch = () => {
    setSearchKeyword('')
    setSearchDate('')
    setIsSearching(false)
    setHistoryPage(1)
  }

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data) => userAPI.update(id, data),
    onSuccess: async (response) => {
      queryClient.invalidateQueries(['user', id])
      if (isOwnProfile) {
        updateUser(response.data.user)
      }
      
      // If email was changed, send verification email and show verification modal
      if (response.data.emailChanged) {
        const updatedEmail = response.data.user.email
        setNewEmail(updatedEmail)
        
        // Send verification email
        try {
          await authAPI.resendVerification(updatedEmail)
          toast.success('Profile updated! Verification code sent to your new email.')
          setShowEditModal(false)
          setShowVerifyModal(true)
        } catch (error) {
          toast.error('Profile updated, but failed to send verification email. Please resend.')
          setShowEditModal(false)
          setShowVerifyModal(true)
        }
      } else {
        toast.success('Profile updated!')
        setShowEditModal(false)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    },
  })

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: () => authAPI.verifyEmail(newEmail, verificationCode),
    onSuccess: (response) => {
      const { token, user: updatedUser } = response.data
      // Update token and user info with new JWT token
      login(token, updatedUser)
      queryClient.invalidateQueries(['user', id])
      toast.success('Email verified successfully!')
      setShowVerifyModal(false)
      setVerificationCode('')
      setNewEmail('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Verification failed')
    },
  })

  // Resend verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: () => authAPI.resendVerification(newEmail),
    onSuccess: () => {
      toast.success('Verification code sent!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to resend code')
    },
  })

  // Upload profile image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const response = await fileAPI.upload(file, 'profile')
      return userAPI.updateProfileImage(id, response.data.url)
    },
    onSuccess: (response) => {
      // Update user data in cache immediately
      queryClient.setQueryData(['user', id], (old) => ({
        ...old,
        data: {
          ...old?.data,
          user: {
            ...old?.data?.user,
            profileImageUrl: response.data.user.profileImageUrl
          }
        }
      }))
      // Invalidate to refetch if needed
      queryClient.invalidateQueries(['user', id])
      if (isOwnProfile) {
        updateUser({ profileImageUrl: response.data.user.profileImageUrl })
      }
      toast.success('Profile image updated!')
    },
    onError: () => {
      toast.error('Failed to upload image')
    },
  })

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      uploadImageMutation.mutate(file)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (userLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card p-8 mb-6 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Image */}
          <div className="relative">
            <Avatar
              profileImageUrl={user.profileImageUrl}
              firstName={user.firstName}
              lastName={user.lastName}
              size="w-32 h-32"
            />
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                <FiUpload className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-400 mb-2">{user.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <FiCalendar />
                <span>Joined {formatDate(user.dateJoined)}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                user.type === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                user.type === 'admin' ? 'bg-primary-500/20 text-primary-400' :
                user.type === 'unverified' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {user.type.replace('_', ' ')}
              </span>
            </div>
            {/* User ID */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 text-sm">
              <FiHash className="w-4 h-4" />
              <span>ID: {user.userId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(user.userId))
                  toast.success('User ID copied to clipboard!')
                }}
                className="ml-2 text-gray-500 hover:text-white transition-colors"
                title="Copy User ID"
              >
                <FiCopy className="w-4 h-4" />
              </button>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => {
                  setEditData({ firstName: user.firstName, lastName: user.lastName, email: user.email })
                  setShowEditModal(true)
                }}
                className="btn-secondary mt-4 flex items-center gap-2 mx-auto md:mx-0"
              >
                <FiEdit2 /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FiMessageCircle />
          Top Posts
        </h2>
        {topPosts.length === 0 ? (
          <p className="text-gray-400">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {topPosts.map((post) => (
              <Link
                key={post.postId}
                to={`/posts/${post.postId}`}
                className="block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <h3 className="text-white font-medium">{post.title}</h3>
                <p className="text-gray-400 text-sm">{post.replyCount || 0} replies</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Drafts (Own profile only) */}
      {isOwnProfile && (
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiFileText />
            Drafts
          </h2>
          {drafts.length === 0 ? (
            <p className="text-gray-400">No drafts.</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <Link
                  key={draft.postId}
                  to={`/posts/${draft.postId}`}
                  className="block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <h3 className="text-white font-medium">{draft.title}</h3>
                  <p className="text-gray-400 text-sm">{formatDate(draft.dateCreated)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View History (Own profile only) */}
      {isOwnProfile && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiClock />
            View History
          </h2>

          {/* Search and Filter Section */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Keyword Search */}
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by keyword..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  className="input-field pl-10"
                />
              </div>

              {/* Date Filter */}
              <div className="flex-1 relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  lang="en"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Search Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSearch}
                disabled={historyLoading || (!searchKeyword && !searchDate)}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSearch className="w-4 h-4" />
                Search
              </button>
              {(isSearching || searchKeyword || searchDate) && (
                <button
                  onClick={handleResetSearch}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>

            {/* Search Status */}
            {isSearching && (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <FiFilter className="w-4 h-4" />
                <span>
                  {searchKeyword && `Keyword: "${searchKeyword}"`}
                  {searchKeyword && searchDate && ' • '}
                  {searchDate && `Date: ${new Date(searchDate).toLocaleDateString()}`}
                </span>
              </div>
            )}
          </div>

          {/* History List */}
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {isSearching ? 'No results found.' : 'No view history.'}
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((item) => (
                  <Link
                    key={item.historyId}
                    to={`/posts/${item.postId}`}
                    className="block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <h3 className="text-white font-medium mb-1">{item.post?.title || 'Post'}</h3>
                    <p className="text-gray-400 text-sm">Viewed {formatDate(item.viewDate)}</p>
                  </Link>
                ))}
              </div>
              
              {/* Pagination - Only show when not searching */}
              {!isSearching && historyTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                      let pageNum;
                      if (historyTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (historyPage <= 3) {
                        pageNum = i + 1;
                      } else if (historyPage >= historyTotalPages - 2) {
                        pageNum = historyTotalPages - 4 + i;
                      } else {
                        pageNum = historyPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setHistoryPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            historyPage === pageNum
                              ? 'bg-primary-500 text-white'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setHistoryPage(prev => Math.min(historyTotalPages, prev + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Page Info */}
              {history.length > 0 && !isSearching && (
                <div className="text-center text-gray-400 text-sm mt-4">
                  Showing {((historyPage - 1) * historyPerPage) + 1} to {Math.min(historyPage * historyPerPage, historyTotal)} of {historyTotal} items
                </div>
              )}
              {isSearching && history.length > 0 && (
                <div className="text-center text-gray-400 text-sm mt-4">
                  Found {history.length} result{history.length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
                <p className="text-yellow-400 text-xs mt-1">
                  ⚠️ 更新邮箱后，您将需要验证新邮箱才能恢复完整权限
                </p>
              </div>
              <button
                onClick={() => updateMutation.mutate(editData)}
                disabled={updateMutation.isPending}
                className="btn-primary w-full"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Verify New Email</h2>
              <button 
                onClick={() => {
                  setShowVerifyModal(false)
                  setVerificationCode('')
                  setNewEmail('')
                }} 
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiMail className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-400 mb-2">
                我们已向您的新邮箱发送了验证码
              </p>
              <p className="text-primary-400 font-medium">{newEmail}</p>
              <p className="text-yellow-400 text-sm mt-3">
                ⚠️ 您的账户状态已变为未验证，验证成功后即可恢复完整权限
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (verificationCode.length === 6) {
                  verifyEmailMutation.mutate()
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2 text-center">
                  输入验证码
                </label>
                <input
                  type="text"
                  className="input-field text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                type="submit"
                disabled={verificationCode.length !== 6 || verifyEmailMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {verifyEmailMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck />
                    验证邮箱
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-gray-400 mb-2 text-sm">没有收到验证码？</p>
              <button
                onClick={() => resendVerificationMutation.mutate()}
                disabled={resendVerificationMutation.isPending}
                className="text-primary-400 hover:text-primary-300 font-medium text-sm"
              >
                {resendVerificationMutation.isPending ? '发送中...' : '重新发送'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowVerifyModal(false)
                  setVerificationCode('')
                  setNewEmail('')
                  navigate('/home')
                }}
                className="text-gray-500 hover:text-gray-400 text-sm"
              >
                稍后验证
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
