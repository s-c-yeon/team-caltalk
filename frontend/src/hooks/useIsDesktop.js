import { useEffect, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 768px)';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DESKTOP_QUERY);
    function handleChange(e) {
      setIsDesktop(e.matches);
    }
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}
