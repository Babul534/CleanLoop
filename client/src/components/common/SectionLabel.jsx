import React from 'react';

/**
 * SectionLabel component
 * Editorial kicker tag establishing strong visual rhythm and taxonomy.
 */
export const SectionLabel = ({
  children,
  number,
  variant = 'forest',
  dot = true,
  className = ''
}) => {
  return (
    <div className={`section-label section-label-${variant} ${className}`}>
      {dot && <span className="section-label-dot" aria-hidden="true" />}
      {number && <span className="section-label-number">{number}</span>}
      <span className="section-label-text">{children}</span>
    </div>
  );
};

export default SectionLabel;
