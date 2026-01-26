import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { messageAPI } from '../../services/api'
import { FiMail, FiCheck, FiX, FiClock, FiUser } from 'react-icons/fi'

const MessagesPage = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['messages', filter],
    queryFn: () => messageAPI.getAll({ status: filter === 'all' ? undefined : filter }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => messageAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages'])
      toast.success('Status updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status')
    },
  })

  const messages = data?.data?.messages || []

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Message Management</h1>
          <p className="text-gray-400">Manage contact messages from users</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'open', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <FiMail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No messages</h3>
            <p className="text-gray-400">No messages to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Date</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Subject</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Email</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Message</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {messages.map((message) => (
                  <tr key={message.messageId} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-gray-300 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-gray-500" />
                        {formatDate(message.dateCreated)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {message.subject}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-500" />
                        {message.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                      {message.message}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        message.status === 'open'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {message.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateStatusMutation.mutate({
                          id: message.messageId,
                          status: message.status === 'open' ? 'closed' : 'open'
                        })}
                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                          message.status === 'open'
                            ? 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {message.status === 'open' ? (
                          <><FiX /> Close</>
                        ) : (
                          <><FiCheck /> Reopen</>
                        )}
                      </button>
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

export default MessagesPage
