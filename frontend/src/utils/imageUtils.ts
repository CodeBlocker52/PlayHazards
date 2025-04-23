// Image Utility Functions

// Default image path (fallback)
const DEFAULT_IMAGE = '/av1.png';

// Helper function to get image URL
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return DEFAULT_IMAGE;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a path starting with '/', it's already relative to public
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Otherwise, assume it's a filename and prepend with '/'
  return `/${imagePath}`;
};

// Function to get a random avatar image from the public directory
export const getRandomAvatar = (): string => {
  const avatarNumber = Math.floor(Math.random() * 8) + 1;
  return `/av${avatarNumber}.png`;
};