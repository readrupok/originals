import React from 'react';

/**
 * Rupok Stories Literary Arch Mark
 * Scalable vector graphics for the Rupok Stories brand icon.
 * Features 3 progressive book pages sweeping into an arched literary gateway.
 */
export default function RupokStoriesMark({
  size = 28,
  width,
  height,
  color = '#9c3a1d',
  className = '',
  style = {},
  ariaLabel = 'Rupok Stories'
}) {
  const h = height || size;
  const w = width || Math.round(h * (396 / 492));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 396 492"
      width={w}
      height={h}
      fill="none"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
      aria-label={ariaLabel}
      role="img"
    >
      <g fill={color}>
        {/* Left Page & Flat Base */}
        <path d="M 40 114 L 0 116 L 0 492 L 323 492 C 236 464.4 139 456.8 41 459 L 40 114 Z" />
        {/* Middle Page */}
        <path d="M 104 72 L 60 74 L 60 435 C 177.8 430.8 292.8 448.7 394 491 C 310.5 422.4 212.1 389.7 103 383 L 104 72 Z" />
        {/* Main Arched Page */}
        <path d="M 127 0 L 127 361 C 227.1 368.7 317.6 399.5 395 462 L 396 171 C 394.1 117.9 350.6 78.6 311 55 C 255.4 22.8 194.8 2.6 127 0 Z" />
      </g>
    </svg>
  );
}

