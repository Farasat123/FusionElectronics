export const USD_TO_PKR_RATE = 280;

/**
 * Formats a number into a shorter human-readable string (e.g., 1000 -> 1k, 1500 -> 1.5k, 1000000 -> 1m).
 * @param {number|string} num - The number to format
 * @returns {string} Short formatted string
 */
export const formatShortNumber = num => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const val = Number(num);
  const abs = Math.abs(val);

  if (abs >= 1000000000) {
    const formatted = (val / 1000000000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}b`;
  }
  if (abs >= 1000000) {
    const formatted = (val / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}m`;
  }
  if (abs >= 1000) {
    const formatted = (val / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  const rounded = Math.round(val * 10) / 10;
  if (Math.abs(rounded) >= 1000) {
    return `${(rounded / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return rounded.toString();
};

/**
 * Converts a price in USD to PKR (1$ = Rs 280) and formats it into compact/short representation.
 * @param {number|string} priceInUSD - Price in USD
 * @returns {string} Formatted price with "Rs" prefix (e.g., "Rs 280", "Rs 1k", "Rs 28k", "Rs 307.7k")
 */
export const formatPrice = priceInUSD => {
  if (priceInUSD === null || priceInUSD === undefined || isNaN(priceInUSD)) {
    return 'Rs 0';
  }
  const inRs = Number(priceInUSD) * USD_TO_PKR_RATE;
  return `Rs ${formatShortNumber(inRs)}`;
};
