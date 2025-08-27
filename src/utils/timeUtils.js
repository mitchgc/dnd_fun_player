/**
 * Format timestamp to relative time (e.g., "just now", "2 min ago")
 */
export const formatRelativeTime = (timestamp) => {
  // Handle different timestamp formats
  let date;
  if (typeof timestamp === 'string') {
    // Try parsing as time string first (e.g., "11:04:33")
    if (timestamp.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      const today = new Date();
      const [hours, minutes, seconds] = timestamp.split(':').map(Number);
      date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
    } else {
      date = new Date(timestamp);
    }
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
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
    return date.toLocaleDateString();
  }
};