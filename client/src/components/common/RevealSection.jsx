import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

/**
 * RevealSection Component
 * Wraps content to apply scroll-triggered reveals using CSS transitions.
 */
export const RevealSection = ({
  children,
  className = '',
  animation = 'fade-up', // 'fade-up' | 'fade' | 'stagger'
  delay = 0,
  threshold = 0.12,
  as: Component = 'div',
  ...rest
}) => {
  const [ref, isVisible] = useScrollReveal({ threshold });

  const style = delay ? { transitionDelay: `${delay}ms` } : {};

  return (
    <Component
      ref={ref}
      style={style}
      className={`reveal-wrapper reveal-${animation} ${isVisible ? 'is-revealed' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default RevealSection;
