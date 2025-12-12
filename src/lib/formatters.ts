/**
 * Number and currency formatting utilities
 * Use these throughout the application for consistent number display
 */

/**
 * Format a number with thousand separators (commas)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string like "1,234,567"
 */
export const formatNumber = (
  value: number | undefined | null,
  decimals: number = 0
): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a currency value with MRU prefix and thousand separators
 * @param value - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "MRU 1,234,567.89"
 */
export const formatCurrency = (
  value: number | undefined | null,
  decimals: number = 2
): string => {
  return `MRU ${formatNumber(value, decimals)}`;
};

/**
 * Format a currency value without prefix (just the number with commas)
 * @param value - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "1,234,567.89"
 */
export const formatAmount = (
  value: number | undefined | null,
  decimals: number = 2
): string => {
  return formatNumber(value, decimals);
};

/**
 * Format a percentage value
 * @param value - The percentage to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "12.5%"
 */
export const formatPercent = (
  value: number | undefined | null,
  decimals: number = 1
): string => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

/**
 * Format a compact number (K, M, B suffixes)
 * @param value - The number to format
 * @returns Formatted string like "1.2M" or "456K"
 */
export const formatCompact = (
  value: number | undefined | null
): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

