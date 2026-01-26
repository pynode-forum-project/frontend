import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { postAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { FiPlus, FiClock, FiMessageCircle, FiFilter, FiX, FiAlertCircle, FiRefreshCw, FiArrowUp, FiArrowDown, FiUser, FiRotateCcw, FiHash, FiCopy, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import CreatePostModal from '../components/CreatePostModal'
import Avatar from '../components/Avatar'

const HomePage = () => {
  const queryClient = useQueryClient()
  const { user, isAdmin } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('published')
  const [sortBy, setSortBy] = useState('dateCreated')
  const [sortOrder, setSortOrder] = useState('desc')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 20

  // Reset filters to default
  const resetFilters = () => {
    setSortBy('dateCreated')
    setSortOrder('desc')
    setCreatorFilter('')
    setCurrentPage(1)
  }

  // Toggle sort order for reply count
  const toggleReplySort = () => {
    if (sortBy === 'replyCount') {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy('replyCount')
      setSortOrder('desc')
    }
  }

  // Toggle sort order for date created
  const toggleDateSort = () => {
    if (sortBy === 'dateCreated') {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy('dateCreated')
      setSortOrder('desc')
    }
  }

  // Fetch posts based on active tab
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', activeTab, sortBy, sortOrder, creatorFilter, currentPage],
    queryFn: async () => {
      if (activeTab === 'published') {
        const params = { sortBy, sortOrder, page: currentPage, limit: postsPerPage }
        if (creatorFilter) {
          params.userId = parseInt(creatorFilter)
        }
        return postAPI.getAll(params)
      } else if (activeTab === 'banned') {
        return postAPI.getBanned({ page: currentPage, limit: postsPerPage })
      } else if (activeTab === 'deleted') {
        return postAPI.getDeleted({ page: currentPage, limit: postsPerPage })
      }
    },
  })

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const banMutation = useMutation({
    mutationFn: (postId) => postAPI.ban(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
      toast.success('Post banned')
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (postId) => postAPI.unban(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
      toast.success('Post unbanned')
    },
  })

  const recoverMutation = useMutation({
    mutationFn: (postId) => postAPI.recover(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
      toast.success('Post recovered')
    },
  })

  const posts = postsData?.data?.posts || []
  const totalPages = postsData?.data?.totalPages || 1
  const total = postsData?.data?.total || 0

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isAdmin() ? 'Admin Dashboard' : 'Forum Posts'}
          </h1>
          <p className="text-gray-400">
            {isAdmin() ? 'Manage posts and users' : 'Discover and share ideas'}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus />
          New Post
        </button>
      </div>

      {/* Tabs for Admin */}
      {isAdmin() && (
        <div className="flex gap-2 mb-6">
          {['published', 'banned', 'deleted'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {activeTab === 'published' && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Filters & Sort</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort by Reply Count */}
            <button
              onClick={() => {
                toggleReplySort()
                handleFilterChange()
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                sortBy === 'replyCount'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <FiMessageCircle className="w-4 h-4" />
              Replies
              {sortBy === 'replyCount' && (
                sortOrder === 'desc' ? <FiArrowDown className="w-4 h-4" /> : <FiArrowUp className="w-4 h-4" />
              )}
            </button>

            {/* Sort by Date Created */}
            <button
              onClick={() => {
                toggleDateSort()
                handleFilterChange()
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                sortBy === 'dateCreated'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <FiClock className="w-4 h-4" />
              Date
              {sortBy === 'dateCreated' && (
                sortOrder === 'desc' ? <FiArrowDown className="w-4 h-4" /> : <FiArrowUp className="w-4 h-4" />
              )}
            </button>

            {/* Filter by Creator */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <FiUser className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                placeholder="Creator ID"
                value={creatorFilter}
                onChange={(e) => {
                  setCreatorFilter(e.target.value)
                  handleFilterChange()
                }}
                className="bg-transparent text-white placeholder-gray-500 w-24 focus:outline-none"
              />
              {creatorFilter && (
                <button
                  onClick={() => {
                    setCreatorFilter('')
                    handleFilterChange()
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-white/5 text-gray-400 hover:bg-white/10"
            >
              <FiRotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <FiMessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No posts yet</h3>
          <p className="text-gray-400">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.postId}
              className="card p-6 hover:border-primary-500/30 transition-all animate-fade-in group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    to={`/posts/${post.postId}`}
                    className="text-xl font-semibold text-white hover:text-primary-400 transition-colors"
                  >
                    {post.title}
                  </Link>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Avatar
                        profileImageUrl={post.user?.profileImageUrl}
                        firstName={post.user?.firstName}
                        lastName={post.user?.lastName}
                        size="w-6 h-6"
                      />
                      <span>{post.user?.firstName} {post.user?.lastName}</span>
                      {post.user?.userId && (
                        <div className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
                          <FiHash className="w-3 h-3" />
                          <span className="text-xs">{post.user.userId}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              navigator.clipboard.writeText(String(post.user.userId))
                              toast.success('User ID copied!')
                            }}
                            className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                            title="Copy User ID"
                          >
                            <FiCopy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {formatDate(post.dateCreated)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageCircle className="w-4 h-4" />
                      {post.replyCount || 0} replies
                    </div>
                    {post.isArchived && (
                      <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded">
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin() && activeTab === 'published' && (
                  <button
                    onClick={() => banMutation.mutate(post.postId)}
                    className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                  >
                    Ban
                  </button>
                )}
                {isAdmin() && activeTab === 'banned' && (
                  <button
                    onClick={() => unbanMutation.mutate(post.postId)}
                    className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm"
                  >
                    Unban
                  </button>
                )}
                {isAdmin() && activeTab === 'deleted' && (
                  <button
                    onClick={() => recoverMutation.mutate(post.postId)}
                    className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm flex items-center gap-1"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Recover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && posts.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
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
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Info */}
      {!isLoading && posts.length > 0 && (
        <div className="text-center text-gray-400 text-sm mt-4">
          Showing {((currentPage - 1) * postsPerPage) + 1} to {Math.min(currentPage * postsPerPage, total)} of {total} posts
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

export default HomePage
