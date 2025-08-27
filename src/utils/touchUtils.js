/**
 * Mobile touch utilities for enhanced user experience
 */

/**
 * Haptic feedback simulation using Vibration API
 */
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Very light tap
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30); // Medium feedback
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50]); // Pattern for strong feedback
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Success pattern
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]); // Error pattern
    }
  }
};

/**
 * Long press handler for mobile devices
 */
export const useLongPress = (onLongPress, options = {}) => {
  const { 
    threshold = 500, // ms
    onStart = () => {},
    onFinish = () => {},
    onCancel = () => {}
  } = options;

  let timeout = null;
  let preventClick = false;

  const start = (event) => {
    if (event.touches && event.touches.length > 1) return; // Ignore multi-touch
    
    onStart();
    preventClick = false;
    
    timeout = setTimeout(() => {
      onLongPress(event);
      preventClick = true;
      hapticFeedback.medium();
    }, threshold);
  };

  const clear = (event, shouldTriggerFinish = true) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    if (shouldTriggerFinish) {
      onFinish();
    } else {
      onCancel();
    }
  };

  const clickHandler = (event) => {
    if (preventClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: (event) => clear(event, false),
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: (event) => clear(event, false),
    onClick: clickHandler
  };
};

/**
 * Swipe gesture detection
 */
export const useSwipeGesture = (onSwipe, options = {}) => {
  const { 
    minDistance = 50,
    maxTime = 300,
    preventScroll = false
  } = options;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    
    if (preventScroll) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    
    if (deltaTime > maxTime) return;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < minDistance) return;
    
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    let direction;
    
    if (angle >= -45 && angle <= 45) {
      direction = 'right';
    } else if (angle >= 45 && angle <= 135) {
      direction = 'down';
    } else if (angle >= -135 && angle <= -45) {
      direction = 'up';
    } else {
      direction = 'left';
    }
    
    onSwipe(direction, { deltaX, deltaY, distance, angle });
    hapticFeedback.light();
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
};

/**
 * Improved touch target size checker
 */
export const ensureMinTouchTarget = (element) => {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const minSize = 44; // iOS/Android recommended minimum
  
  if (rect.width < minSize || rect.height < minSize) {
    console.warn(`Touch target too small: ${rect.width}x${rect.height}px. Minimum: ${minSize}x${minSize}px`, element);
    
    // Auto-fix with padding if possible
    const currentPadding = parseInt(getComputedStyle(element).padding) || 0;
    const neededPadding = Math.max(0, (minSize - Math.min(rect.width, rect.height)) / 2);
    
    if (neededPadding > currentPadding) {
      element.style.padding = `${neededPadding}px`;
    }
  }
};