/**
 * Utility functions for safe number operations
 */

/**
 * Safely formats a number to a fixed number of decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string or '0.00' if value is null/undefined
 */
export const safeToFixed = (value: number | null | undefined, decimals: number = 2): string => {
  const safeValue = value || 0;
  return safeValue.toFixed(decimals);
};

/**
 * Safely formats a number as currency
 * @param value - The number to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export const safeFormatCurrency = (
  value: number | null | undefined, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  const safeValue = value || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(safeValue);
};

/**
 * Safely formats a number as a percentage
 * @param value - The number to format (0-1 range)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const safeFormatPercentage = (value: number | null | undefined, decimals: number = 1): string => {
  const safeValue = value || 0;
  return `${(safeValue * 100).toFixed(decimals)}%`;
};

/**
 * Safely formats a distance value
 * @param distance - Distance in kilometers
 * @returns Formatted distance string (meters or kilometers)
 */
export const safeFormatDistance = (distance: number | null | undefined): string => {
  const safeDistance = distance || 0;
  if (safeDistance < 1) {
    return `${Math.round(safeDistance * 1000)}m`;
  }
  return `${safeDistance.toFixed(1)}km`;
};

/**
 * Safely formats a duration in hours
 * @param hours - Duration in hours
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted duration string
 */
export const safeFormatDuration = (hours: number | null | undefined, decimals: number = 1): string => {
  const safeHours = hours || 0;
  return `${safeHours.toFixed(decimals)} hour${safeHours !== 1 ? 's' : ''}`;
};

/**
 * Safely formats coordinates
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted coordinate string
 */
export const safeFormatCoordinates = (
  latitude: number | null | undefined, 
  longitude: number | null | undefined, 
  decimals: number = 4
): string => {
  const safeLat = latitude || 0;
  const safeLng = longitude || 0;
  return `${safeLat.toFixed(decimals)}, ${safeLng.toFixed(decimals)}`;
};
