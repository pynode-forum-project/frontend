import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postAPI, fileAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { FiX, FiSend, FiSave, FiPaperclip, FiXCircle, FiImage, FiEdit2 } from 'react-icons/fi'

const CreatePostModal = ({ onClose, editPost = null }) => {
  const queryClient = useQueryClient()
  const { isVerified } = useAuthStore()
  const [formData, setFormData] = useState({
    title: editPost?.title || '',
    content: editPost?.content || '',
    images: editPost?.images || [],
    attachments: editPost?.attachments || [],
  })
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadingImages, setUploadingImages] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedImages, setSelectedImages] = useState([])

  const createMutation = useMutation({
    mutationFn: (data) => editPost 
      ? postAPI.update(editPost.postId, data)
      : postAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
      toast.success(editPost ? 'Post updated!' : 'Post created!')
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save post')
    },
  })

  const isImageFile = (file) => {
    return file.type.startsWith('image/')
  }

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files).filter(isImageFile)
    if (files.length === 0) {
      toast.error('Please select image files only')
      return
    }

    setUploadingImages(files.map(f => f.name))

    try {
      const uploadPromises = files.map(file => 
        fileAPI.upload(file, 'post').then(res => res.data.url)
      )
      
      const urls = await Promise.all(uploadPromises)
      setFormData({
        ...formData,
        images: [...formData.images, ...urls]
      })
      setSelectedImages([...selectedImages, ...files])
      setUploadingImages([])
      toast.success(`${files.length} image(s) uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload image(s)')
      setUploadingImages([])
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).filter(f => !isImageFile(f))
    if (files.length === 0) {
      toast.error('Please select non-image files only')
      return
    }

    setUploadingFiles(files.map(f => f.name))

    try {
      const uploadPromises = files.map(file => 
        fileAPI.upload(file, 'attachment').then(res => res.data.url)
      )
      
      const urls = await Promise.all(uploadPromises)
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...urls]
      })
      setSelectedFiles([...selectedFiles, ...files])
      setUploadingFiles([])
      toast.success(`${files.length} file(s) uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload file(s)')
      setUploadingFiles([])
    }
  }

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    })
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const handleRemoveAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    })
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = (status) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    // When editing a published post, don't change status
    // Only update content without changing status
    const submitData = editPost && editPost.status === 'published'
      ? { ...formData } // Don't include status for published posts
      : { ...formData, status } // Include status for new posts or drafts
    createMutation.mutate(submitData)
  }

  const getFileName = (url) => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      return decodeURIComponent(pathParts[pathParts.length - 1])
    } catch {
      return url.split('/').pop() || 'attachment'
    }
  }

  if (!isVerified()) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="card p-8 max-w-md w-full animate-fade-in">
          <h2 className="text-2xl font-bold text-white mb-4">Verification Required</h2>
          <p className="text-gray-400 mb-6">
            You need to verify your email before you can create posts.
          </p>
          <button onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter post title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Content
            </label>
            <textarea
              className="input-field min-h-[200px] resize-y"
              placeholder="Write your post content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Images
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                  disabled={uploadingImages.length > 0}
                />
                <div className="btn-secondary flex items-center gap-2 w-fit">
                  <FiImage />
                  {uploadingImages.length > 0 ? 'Uploading...' : 'Add Images'}
                </div>
              </label>

              {/* Uploading indicator */}
              {uploadingImages.length > 0 && (
                <div className="text-sm text-gray-400">
                  Uploading: {uploadingImages.join(', ')}
                </div>
              )}

              {/* Images preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative group bg-white/5 rounded-lg overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiXCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Attachments
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploadingFiles.length > 0}
                />
                <div className="btn-secondary flex items-center gap-2 w-fit">
                  <FiPaperclip />
                  {uploadingFiles.length > 0 ? 'Uploading...' : 'Add Files'}
                </div>
              </label>

              {/* Uploading indicator */}
              {uploadingFiles.length > 0 && (
                <div className="text-sm text-gray-400">
                  Uploading: {uploadingFiles.join(', ')}
                </div>
              )}

              {/* Attachments list */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-2 flex-1"
                      >
                        <FiPaperclip className="w-4 h-4" />
                        {getFileName(url)}
                      </a>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <FiXCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {/* Show "Save as Draft" only for new posts or unpublished posts */}
            {(!editPost || editPost.status === 'unpublished') && (
              <button
                onClick={() => handleSubmit('unpublished')}
                disabled={createMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <FiSave />
                Save as Draft
              </button>
            )}
            {/* Show "Publish" for new posts or drafts */}
            {(!editPost || editPost.status === 'unpublished') && (
              <button
                onClick={() => handleSubmit('published')}
                disabled={createMutation.isPending}
                className="btn-primary flex items-center gap-2 flex-1"
              >
                {createMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSend />
                    Publish
                  </>
                )}
              </button>
            )}
            {/* Show "Update Post" for published posts being edited */}
            {editPost && editPost.status === 'published' && (
              <button
                onClick={() => handleSubmit()}
                disabled={createMutation.isPending}
                className="btn-primary flex items-center gap-2 flex-1"
              >
                {createMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiEdit2 />
                    Update Post
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostModal
