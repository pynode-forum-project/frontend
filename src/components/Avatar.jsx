import { useState } from 'react'

/**
 * Avatar component with fallback to initials
 * @param {string} profileImageUrl - URL of the profile image
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} size - Size class (e.g., 'w-8 h-8', 'w-12 h-12', 'w-32 h-32')
 * @param {string} className - Additional CSS classes
 */
const Avatar = ({ 
  profileImageUrl, 
  firstName = '', 
  lastName = '', 
  size = 'w-8 h-8',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false)

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  const showImage = profileImageUrl && !imageError

  const handleImageError = (e) => {
    // Only log error if URL was provided (avoid logging for missing images)
    if (profileImageUrl) {
      console.warn('Failed to load profile image:', profileImageUrl)
    }
    setImageError(true)
    // Hide the broken image
    e.target.style.display = 'none'
  }

  if (showImage) {
    return (
      <div className={`${size} relative ${className}`}>
        <img
          src={profileImageUrl}
          alt={`${firstName} ${lastName}`}
          className={`${size} rounded-full object-cover`}
          onError={handleImageError}
        />
        {/* Fallback initials (hidden behind image, shown on error) */}
        <div 
          className={`${size} rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold absolute inset-0 ${imageError ? '' : 'hidden'}`}
          style={{ fontSize: size.includes('w-32') ? '2rem' : size.includes('w-12') ? '1rem' : '0.875rem' }}
        >
          {initials || '?'}
        </div>
      </div>
    )
  }

  // Fallback to initials when no image URL provided
  return (
    <div 
      className={`${size} rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold ${className}`}
      style={{ fontSize: size.includes('w-32') ? '2rem' : size.includes('w-12') ? '1rem' : '0.875rem' }}
    >
      {initials || '?'}
    </div>
  )
}

export default Avatar
