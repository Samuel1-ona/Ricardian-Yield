import { useState, useEffect } from "react";

/**
 * Hook to check if component is mounted (client-side only)
 * Prevents hydration mismatches in Next.js
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

