/**
 * FC Technology - Product Warranty Formatter
 * 
 * Rules:
 * 1. Non-warranty products must show "Non Warranty" in English (not Bengali).
 * 2. Products with warranty must show full warranty name with "Warranty",
 *    e.g. "1 Year Warranty", "2 Years Warranty", "6 Months Warranty", "Lifetime Warranty".
 */

export const formatWarranty = (warranty) => {
  if (!warranty) return 'Non Warranty';
  const w = String(warranty).trim();
  if (
    !w ||
    w === 'নন-ওয়ারেন্টি' ||
    w === 'ওয়ারেন্টি নেই' ||
    w.toLowerCase() === 'none' ||
    w.toLowerCase() === 'no warranty' ||
    w.toLowerCase() === 'non warranty' ||
    w.toLowerCase() === 'non-warranty'
  ) {
    return 'Non Warranty';
  }

  // If already ends with Warranty or ওয়ারেন্টি, format cleanly
  if (/warranty$/i.test(w) || /ওয়ারেন্টি$/i.test(w)) {
    return w;
  }

  // Capitalize properly: e.g. "1 year" -> "1 Year Warranty", "2 years" -> "2 Years Warranty", "6 months" -> "6 Months Warranty"
  const formatted = w
    .replace(/\b1\s*years?\b/gi, '1 Year')
    .replace(/\b2\s*years?\b/gi, '2 Years')
    .replace(/\b3\s*years?\b/gi, '3 Years')
    .replace(/\b4\s*years?\b/gi, '4 Years')
    .replace(/\b5\s*years?\b/gi, '5 Years')
    .replace(/\b1\s*months?\b/gi, '1 Month')
    .replace(/\b3\s*months?\b/gi, '3 Months')
    .replace(/\b6\s*months?\b/gi, '6 Months')
    .replace(/লাইফটাইম/gi, 'Lifetime');

  if (/warranty$/i.test(formatted) || /ওয়ারেন্টি$/i.test(formatted)) {
    return formatted;
  }

  return `${formatted} Warranty`;
};
