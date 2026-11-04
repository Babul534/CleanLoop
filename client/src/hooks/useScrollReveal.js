import { useEffect, useRef, useState } from 'react';

/**
 * Hook to trigger element animation on scroll into viewport
 * Uses IntersectionObserver with fallback
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0 - 1)
 * @param {string} options.rootMargin - Margin around the root
 * @param {boolean} options.once - Trigger only once
 */
export const useScrollReveal = ({
  threshold = 0.15,
  rootMargin = '0px 0px -40px 0px',
  once = true
} = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [threshold, rootMargin, once]);

  return [elementRef, isVisible];
};

