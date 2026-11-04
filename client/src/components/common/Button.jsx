import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Button Component
 * Supports variants: primary | secondary | outline | text
 * Sizes: sm | md | lg
 * Can render as <button>, <Link> (React Router), or standard <a>
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  as = 'button',
  to,
  href,
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) => {
  const baseClass = `btn btn-${variant} btn-${size} ${className} ${disabled ? 'is-disabled' : ''}`;

  const content = (
    <>
      {Icon && iconPosition === 'left' && (
        <span className="btn-icon btn-icon-left" aria-hidden="true">
          <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
        </span>
      )}
      <span className="btn-text">{children}</span>
      {Icon && iconPosition === 'right' && (
        <span className="btn-icon btn-icon-right" aria-hidden="true">
          <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
        </span>
      )}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClass} onClick={onClick} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={baseClass} onClick={onClick} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={baseClass}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      {...rest}
    >
      {content}
    </button>
  );
};

export default Button;
