/**
 * Format timestamp to relative time (e.g., "just now", "2 min ago")
 * Safari/iOS compatible version
 */
export const formatRelativeTime = (timestamp) => {
  // Handle different timestamp formats
  let date;
  
  if (typeof timestamp === 'number') {
    // Unix timestamp (milliseconds)
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    // Try parsing as time string first (e.g., "11:04:33")
    if (timestamp.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      const today = new Date();
      const [hours, minutes, seconds] = timestamp.split(':').map(Number);
      date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
    } else if (timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // ISO 8601 format (Safari compatible)
      date = new Date(timestamp);
    } else {
      // Try to parse other string formats, but be more careful
      try {
        // Convert locale-specific formats to ISO format if possible
        const parsed = new Date(timestamp);
        if (isNaN(parsed.getTime())) {
          throw new Error('Invalid date');
        }
        date = parsed;
      } catch (e) {
        console.warn('Failed to parse timestamp:', timestamp);
        return 'unknown';
      }
    }
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    console.warn('Invalid timestamp type:', typeof timestamp, timestamp);
    return 'unknown';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date parsed from timestamp:', timestamp);
    return 'unknown';
  }

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 60000) { // Less than 1 minute
    return 'just now';
  } else if (diffMinutes < 60) { // Less than 1 hour
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) { // Less than 1 day
    return `${diffHours}h ago`;
  } else if (diffDays < 7) { // Less than 1 week
    return `${diffDays}d ago`;
  } else {
    // Use a more reliable date formatting method
    try {
      return date.toLocaleDateString();
    } catch (e) {
      return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }
  }
};