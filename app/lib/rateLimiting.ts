// Client-side rate limiting helpers

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(key: string, maxAttempts: number = 5, lockDuration: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const state = rateLimitStore.get(key) || { attempts: 0, lastAttempt: 0 };

  // Check if locked
  if (state.lockedUntil && now < state.lockedUntil) {
    const remainingMinutes = Math.ceil((state.lockedUntil - now) / (60 * 1000));
    throw new Error(`יותר מדי ניסיונות. נסה שוב בעוד ${remainingMinutes} דקות`);
  }

  // Reset if enough time has passed (1 hour)
  if (now - state.lastAttempt > 60 * 60 * 1000) {
    rateLimitStore.set(key, { attempts: 1, lastAttempt: now });
    return true;
  }

  // Increment attempts
  state.attempts += 1;
  state.lastAttempt = now;

  if (state.attempts >= maxAttempts) {
    state.lockedUntil = now + lockDuration;
    rateLimitStore.set(key, state);
    throw new Error(`יותר מדי ניסיונות. נסה שוב בעוד ${Math.ceil(lockDuration / (60 * 1000))} דקות`);
  }

  rateLimitStore.set(key, state);
  return true;
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Debounce helper
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle helper
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
