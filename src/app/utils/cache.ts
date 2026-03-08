
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache: Record<string, CacheEntry<any>> = {};

const IS_BROWSER = typeof window !== 'undefined';

export const setCache = <T>(key: string, data: T, persist: boolean = true) => {
  const entry = {
    data,
    timestamp: Date.now(),
  };
  cache[key] = entry;
  
  if (persist && IS_BROWSER) {
    try {
      localStorage.setItem(`hplant_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache persistence failed:', e);
    }
  }
};

export const getCache = <T>(key: string, ttl: number = 60000): T | null => {
  // Check memory cache first
  const memoryEntry = cache[key];
  if (memoryEntry && (Date.now() - memoryEntry.timestamp <= ttl)) {
    return memoryEntry.data as T;
  }

  // Check localStorage second
  if (IS_BROWSER) {
    try {
      const stored = localStorage.getItem(`hplant_cache_${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() - entry.timestamp <= ttl) {
          // Fill memory cache from storage for next time
          cache[key] = entry;
          return entry.data;
        } else {
          localStorage.removeItem(`hplant_cache_${key}`);
        }
      }
    } catch (e) {
      console.warn('Cache retrieval failed:', e);
    }
  }

  return null;
};

export const clearCache = (key?: string) => {
  if (key) {
    delete cache[key];
    if (IS_BROWSER) localStorage.removeItem(`hplant_cache_${key}`);
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
    if (IS_BROWSER) {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('hplant_cache_')) localStorage.removeItem(k);
      });
    }
  }
};
