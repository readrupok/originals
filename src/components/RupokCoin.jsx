import React from 'react';

/** Decorative brand currency; adjacent text supplies the amount and currency name. */
export default function RupokCoin({ size = 'inline' }) {
  return <span className={`rupok-coin rupok-coin--${size}`} aria-hidden="true">
    <img src="/assets/logos/rupok-coin.svg" alt="" draggable="false" />
  </span>;
}
