/**
 * Utility for formatting numbers in the Hindu-Arabic (Indian) numbering system.
 * Converts figures into Lakhs, Crores, and Arba.
 */

export const formatIndianNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  
  const absoluteVal = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absoluteVal >= 1000000000) {
    return `${sign}${(absoluteVal / 1000000000).toFixed(decimals)} Ar`;
  } else if (absoluteVal >= 10000000) {
    return `${sign}${(absoluteVal / 10000000).toFixed(decimals)} Cr`;
  } else if (absoluteVal >= 100000) {
    return `${sign}${(absoluteVal / 100000).toFixed(decimals)} L`;
  } else {
    return sign + absoluteVal.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
};

/**
 * Formats a value as currency using the Indian numbering system.
 */
export const formatIndianCurrency = (num, decimals = 2) => {
  return `रू ${formatIndianNumber(num, decimals)}`;
};
