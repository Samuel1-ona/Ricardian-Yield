// Utility for caching property names locally
const CACHE_KEY_PREFIX = 'ricardian_property_name_';

/**
 * Store property name in localStorage
 */
export function cachePropertyName(propertyId: bigint | number, name: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${CACHE_KEY_PREFIX}${propertyId}`;
    localStorage.setItem(key, name);
  } catch (e) {
    console.error('Failed to cache property name:', e);
  }
}

/**
 * Get property name from cache
 */
export function getCachedPropertyName(propertyId: bigint | number): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${CACHE_KEY_PREFIX}${propertyId}`;
    return localStorage.getItem(key);
  } catch (e) {
    console.error('Failed to get cached property name:', e);
    return null;
  }
}

/**
 * Get all cached property names
 */
export function getAllCachedPropertyNames(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  try {
    const cache: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const propertyId = key.replace(CACHE_KEY_PREFIX, '');
        const name = localStorage.getItem(key);
        if (name) {
          cache[propertyId] = name;
        }
      }
    }
    return cache;
  } catch (e) {
    console.error('Failed to get all cached property names:', e);
    return {};
  }
}

/**
 * Clear cached property name
 */
export function clearCachedPropertyName(propertyId: bigint | number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${CACHE_KEY_PREFIX}${propertyId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear cached property name:', e);
  }
}

