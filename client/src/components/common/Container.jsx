import React from 'react';

/**
 * Container component for standardized layout widths and gutter padding
 */
export const Container = ({
  children,
  className = '',
  size = 'default', // 'default' | 'narrow' | 'wide'
  as: Component = 'div',
  ...rest
}) => {
  return (
    <Component className={`layout-container layout-container-${size} ${className}`} {...rest}>
      {children}
    </Component>
  );
};

export default Container;
