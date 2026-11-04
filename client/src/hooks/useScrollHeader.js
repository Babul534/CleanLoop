import { useState, useEffect } from 'react';

/**
 * Hook to track window scroll position for navigation transitions
 * @param {number} threshold - Scroll Y position threshold in pixels
 * @returns {boolean} isScrolled
 */
export const useScrollHeader = (threshold = 24) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isScrolled;
};
