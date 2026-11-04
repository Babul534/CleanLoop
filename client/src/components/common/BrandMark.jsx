import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandMark Component
 * Custom SVG brand emblem and typographical wordmark for CleanLoop.
 * Avoids generic recycling emojis in favor of a precision civic-tech emblem.
 */
export const BrandMark = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  inverse = false,
  to = '/'
}) => {
  const iconDimensions = {
    sm: 28,
    md: 36,
    lg: 44
  }[size] || 36;

  const content = (
    <div className={`brandmark-container brandmark-${size} ${inverse ? 'is-inverse' : ''}`}>
      <svg
        width={iconDimensions}
        height={iconDimensions}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brandmark-emblem"
        aria-hidden="true"
      >
        {/* Base rounded shield / municipal seal foundation */}
        <rect
          x="2"
          y="2"
          width="40"
          height="40"
          rx="10"
          fill={inverse ? '#FFFFFF' : '#193A2E'}
          className="brandmark-base"
        />
        
        {/* Continuous closed loop orbital paths */}
        <path
          d="M13 22C13 17.0294 17.0294 13 22 13C26.9706 13 31 17.0294 31 22C31 26.9706 26.9706 31 22 31C18.5 31 15.5 29 14.2 26"
          stroke={inverse ? '#193A2E' : '#285744'}
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        
        {/* Active flow ribbon in Lime */}
        <path
          d="M12 20C12.5 15.5 16.5 12 21.5 12C26.5 12 30.5 15.5 31.5 20C32.5 24.5 29.5 29 25 31.5C21 33.7 15.5 32 13.5 28L13 27"
          stroke={inverse ? '#193A2E' : '#D9F36A'}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic closed node indicators */}
        <circle cx="13" cy="27" r="2.6" fill={inverse ? '#285744' : '#D9F36A'} />
        <circle cx="29" cy="16" r="2.2" fill={inverse ? '#193A2E' : '#9CCDB8'} />
        <circle cx="22" cy="22" r="1.6" fill={inverse ? '#193A2E' : '#FFFFFF'} />
      </svg>

      {showWordmark && (
        <div className="brandmark-text">
          <div className="brandmark-name">
            Clean<span className="brandmark-highlight">Loop</span>
          </div>
          {showTagline && (
            <div className="brandmark-subtitle">Smart Waste Management</div>
          )}
        </div>
      )}
    </div>
  );

  const handleClick = (e) => {
    if (to === '/' && window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
    }
  };

  if (to) {
    return (
      <Link to={to} className="brandmark-link" onClick={handleClick} aria-label="CleanLoop Home">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandMark;

