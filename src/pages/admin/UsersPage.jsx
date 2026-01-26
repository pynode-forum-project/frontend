import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { FiUsers, FiShield, FiUserX, FiUserCheck, FiStar, FiTrash2 } from 'react-icons/fi'
import Avatar from '../../components/Avatar'

const UsersPage = () => {
  const queryClient = useQueryClient()
  const { user: currentUser, isSuperAdmin } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.getAll(),
  })

  const banMutation = useMutation({
    mutationFn: (userId) => userAPI.ban(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User banned')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to ban user')
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (userId) => userAPI.unban(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User unbanned')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to unban user')
    },
  })

  const promoteMutation = useMutation({
    mutationFn: (userId) => userAPI.promote(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User promoted to admin')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to promote user')
    },
  })

  const demoteMutation = useMutation({
    mutationFn: (userId) => userAPI.demote(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User demoted to normal user')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to demote user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId) => userAPI.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })

  const users = data?.data?.users || []

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getUserTypeBadge = (type) => {
    const badges = {
      super_admin: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: FiStar },
      admin: { bg: 'bg-primary-500/10', text: 'text-primary-400', icon: FiShield },
      normal: { bg: 'bg-green-500/10', text: 'text-green-400', icon: FiUserCheck },
      unverified: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: FiUsers },
    }
    const badge = badges[type] || badges.normal
    const Icon = badge.icon
    return (
      <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {type.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <FiUsers className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No users</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">ID</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Name</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Email</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Joined</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Type</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      #{user.userId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          profileImageUrl={user.profileImageUrl}
                          firstName={user.firstName}
                          lastName={user.lastName}
                          size="w-8 h-8"
                        />
                        <span className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatDate(user.dateJoined)}
                    </td>
                    <td className="px-6 py-4">
                      {getUserTypeBadge(user.type)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.active !== false
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {user.active !== false ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {/* Don't show ban button for admins */}
                        {!['admin', 'super_admin'].includes(user.type) && (
                          <>
                            {user.active !== false ? (
                              <button
                                onClick={() => banMutation.mutate(user.userId)}
                                disabled={user.userId === currentUser?.userId}
                                className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                              >
                                <FiUserX className="w-4 h-4" />
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => unbanMutation.mutate(user.userId)}
                                className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm flex items-center gap-1"
                              >
                                <FiUserCheck className="w-4 h-4" />
                                Unban
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* Promote/Demote buttons - only for super admin */}
                        {isSuperAdmin() && (
                          <>
                            {user.type === 'normal' && (
                              <button
                                onClick={() => promoteMutation.mutate(user.userId)}
                                className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors text-sm flex items-center gap-1"
                              >
                                <FiShield className="w-4 h-4" />
                                Promote
                              </button>
                            )}
                            {user.type === 'admin' && (
                              <button
                                onClick={() => demoteMutation.mutate(user.userId)}
                                className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors text-sm flex items-center gap-1"
                              >
                                <FiShield className="w-4 h-4" />
                                Demote
                              </button>
                            )}
                            {/* Delete button - only for non-super-admin users */}
                            {user.type !== 'super_admin' && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
                                    deleteMutation.mutate(user.userId)
                                  }
                                }}
                                disabled={user.userId === currentUser?.userId}
                                className="px-3 py-1 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FiTrash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage
