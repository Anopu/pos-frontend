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

/**
 * Format warranty for Price Quotation table only
 * 
 * User requirement:
 * শুধুমাত্র প্রাইস কোটেশন পেজটিতে ওয়ারেন্টি কলামে টু ইয়ারস ওয়ারেন্টি থেকে
 * শুধুমাত্র দুই ইয়ার্স বা ওয়ান ইয়ার (2 Years / 1 Year) লেখা থাকবে, "ওয়ারেন্টি" / "Warranty" লেখাটি থাকবে না।
 */
export const formatQuotationWarranty = (warranty) => {
  if (!warranty) return '-';
  const w = String(warranty).trim();
  if (
    !w ||
    w === 'নন-ওয়ারেন্টি' ||
    w === 'নন-ওয়ারেন্টি' ||
    w === 'ওয়ারেন্টি নেই' ||
    w === 'ওয়ারেন্টি নেই' ||
    w.toLowerCase() === 'none' ||
    w.toLowerCase() === 'no warranty' ||
    w.toLowerCase() === 'non warranty' ||
    w.toLowerCase() === 'non-warranty'
  ) {
    return 'Non Warranty';
  }

  // Normalize durations to standard English representation e.g. "2 Years", "1 Year"
  let formatted = w
    .replace(/(?:1|one|এক|১|ওয়ান)\s*(?:years?|ইয়ার্স?|ইয়ারস?|বছর)/gi, '1 Year')
    .replace(/(?:2|two|দুই|২|টু)\s*(?:years?|ইয়ার্স?|ইয়ারস?|বছর)/gi, '2 Years')
    .replace(/(?:3|three|তিন|৩)\s*(?:years?|ইয়ার্স?|ইয়ারস?|বছর)/gi, '3 Years')
    .replace(/(?:4|four|চার|৪)\s*(?:years?|ইয়ার্স?|ইয়ারস?|বছর)/gi, '4 Years')
    .replace(/(?:5|five|পাঁচ|৫)\s*(?:years?|ইয়ার্স?|ইয়ারস?|বছর)/gi, '5 Years')
    .replace(/(?:6|six|ছয়|৬)\s*(?:months?|মান্থস?|মাস)/gi, '6 Months')
    .replace(/(?:3|three|তিন|৩)\s*(?:months?|মান্থস?|মাস)/gi, '3 Months')
    .replace(/(?:1|one|এক|১|ওয়ান)\s*(?:months?|মান্থস?|মাস)/gi, '1 Month')
    .replace(/(?:লাইফটাইম|lifetime)/gi, 'Lifetime');

  // Strip out "Warranty" and "ওয়ারেন্টি" (both য় and য forms)
  formatted = formatted
    .replace(/(?:ওয়ারেন্টি|ওয়ারেন্টি|warrenty|warranty)/gi, '')
    .trim();

  return formatted || '-';
};
