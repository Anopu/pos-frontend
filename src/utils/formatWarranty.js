/**
 * FC Technology - Product Warranty Formatter & Service Category Translator
 * 
 * Rules:
 * 1. For non-warranty products or services, return empty string '' so "Non-Warranty" / "Non Warranty"
 *    never appears on the printed bill/invoice.
 * 2. Products with warranty show full warranty name with "Warranty",
 *    e.g. "1 Year Warranty", "2 Years Warranty", "6 Months Warranty", "1 Month Warranty", "Lifetime Warranty".
 * 3. Quotation warranty shows duration only (e.g. "1 Year", "2 Years") and '-' for non-warranty.
 * 4. Bilingual service categories: Laptop Servicing, Desktop Servicing, Printer Service, etc.
 */

export const SERVICE_CATEGORIES = [
  {
    id: 'ল্যাপটপ সার্ভিসিং',
    bn: 'ল্যাপটপ সার্ভিসিং',
    en: 'Laptop Servicing',
    bnRegex: /^ল্যাপটপ\s*সার্ভিস(?:িং)?(?:\s*:)?/i,
    enRegex: /^Laptop\s*Servic(?:e|ing)(?:\s*:)?/i
  },
  {
    id: 'ডেস্কটপ সার্ভিসিং',
    bn: 'ডেস্কটপ সার্ভিসিং',
    en: 'Desktop Servicing',
    bnRegex: /^(?:ডেস্কটপ|ডেক্সটপ)\s*সার্ভিস(?:িং)?(?:\s*:)?/i,
    enRegex: /^Desktop\s*Servic(?:e|ing)(?:\s*:)?/i
  },
  {
    id: 'প্রিন্টার সার্ভিস',
    bn: 'প্রিন্টার সার্ভিস',
    en: 'Printer Service',
    bnRegex: /^প্রিন্টার\s*সার্ভিস(?:িং)?(?:\s*:)?/i,
    enRegex: /^Printer\s*Servic(?:e|ing)(?:\s*:)?/i
  },
  {
    id: 'ক্যামেরা ইনস্টলেশন',
    bn: 'ক্যামেরা ইনস্টলেশন',
    en: 'Camera Installation',
    bnRegex: /^ক্যামেরা\s*ইনস্টলেশন(?:\s*:)?/i,
    enRegex: /^Camera\s*Installation(?:\s*:)?/i
  },
  {
    id: 'ক্যামেরা সার্ভিস',
    bn: 'ক্যামেরা সার্ভিস',
    en: 'Camera Service',
    bnRegex: /^ক্যামেরা\s*সার্ভিস(?:িং)?(?:\s*:)?/i,
    enRegex: /^Camera\s*Servic(?:e|ing)(?:\s*:)?/i
  },
  {
    id: 'ইউপিএস সার্ভিস',
    bn: 'ইউপিএস সার্ভিস',
    en: 'UPS Service',
    bnRegex: /^ইউপিএস\s*সার্ভিস(?:িং)?(?:\s*:)?/i,
    enRegex: /^UPS\s*Servic(?:e|ing)(?:\s*:)?/i
  },
  {
    id: 'সাধারণ সার্ভিসিং',
    bn: 'সাধারণ সার্ভিসিং',
    en: 'General Servicing',
    bnRegex: /^সাধারণ\s*সার্ভিস(?:িং)?(?:\s*:)?/i,
    enRegex: /^General\s*Servic(?:e|ing)(?:\s*:)?/i
  }
];

/**
 * Checks whether the given warranty string represents "No Warranty" / "Non-Warranty"
 */
export const isNonWarranty = (warranty) => {
  if (!warranty) return true;
  const w = String(warranty).trim().toLowerCase();
  if (
    !w ||
    w === '-' ||
    w === 'na' ||
    w === 'n/a' ||
    w === 'nil' ||
    w === '0' ||
    w === 'none'
  ) {
    return true;
  }

  // Bengali non-warranty variations
  if (
    w.includes('নন-ওয়ারেন্টি') ||
    w.includes('নন ওয়ারেন্টি') ||
    w.includes('নন-ওয়ারেন্টি') ||
    w.includes('নন ওয়ারেন্টি') ||
    w.includes('ওয়ারেন্টি নেই') ||
    w.includes('ওয়ারেন্টি নেই')
  ) {
    return true;
  }

  // English non-warranty variations
  if (
    w === 'no warranty' ||
    w === 'non warranty' ||
    w === 'non-warranty' ||
    w === 'no-warranty' ||
    w === 'nonwarranty'
  ) {
    return true;
  }

  return false;
};

/**
 * Formats product/service warranty for Invoices, Receipts and Delivery Slips.
 * For non-warranty items, returns empty string '' so "Non-Warranty" is never printed.
 */
export const formatWarranty = (warranty) => {
  if (isNonWarranty(warranty)) return '';
  const w = String(warranty).trim();

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
    .replace(/\b7\s*days?\b/gi, '7 Days')
    .replace(/\b10\s*days?\b/gi, '10 Days')
    .replace(/\b15\s*days?\b/gi, '15 Days')
    .replace(/লাইফটাইম/gi, 'Lifetime');

  if (/warranty$/i.test(formatted) || /ওয়ারেন্টি$/i.test(formatted)) {
    return formatted;
  }

  return `${formatted} Warranty`;
};

/**
 * Format warranty for Price Quotation table only
 */
export const formatQuotationWarranty = (warranty) => {
  if (isNonWarranty(warranty)) return '-';
  const w = String(warranty).trim();

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
    .replace(/(?:7|seven|সাত|৭)\s*(?:days?|দিন)/gi, '7 Days')
    .replace(/(?:লাইফটাইম|lifetime)/gi, 'Lifetime');

  // Strip out "Warranty" and "ওয়ারেন্টি" (both য় and য forms)
  formatted = formatted
    .replace(/(?:ওয়ারেন্টি|ওয়ারেন্টি|warrenty|warranty)/gi, '')
    .trim();

  return formatted || '-';
};

/**
 * Translate service bill item names between Bengali and English
 * E.g. "ল্যাপটপ সার্ভিসিং: উইন্ডোজ ইনস্টলেশন" <-> "Laptop Servicing: উইন্ডোজ ইনস্টলেশন"
 * "ডেক্সটপ সার্ভিসিং" <-> "Desktop Servicing"
 * "প্রিন্টার সার্ভিস" <-> "Printer Service"
 */
export const translateServiceName = (name, targetLang = 'en') => {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();

  if (targetLang === 'en') {
    for (const cat of SERVICE_CATEGORIES) {
      if (cat.bnRegex.test(trimmed) || cat.enRegex.test(trimmed)) {
        if (/^[^:]*:\s*/.test(trimmed)) {
          const rest = trimmed.replace(/^[^:]*:\s*/, '');
          return `${cat.en}: ${rest}`;
        }
        return cat.en;
      }
    }
  } else if (targetLang === 'bn') {
    for (const cat of SERVICE_CATEGORIES) {
      if (cat.enRegex.test(trimmed) || cat.bnRegex.test(trimmed)) {
        if (/^[^:]*:\s*/.test(trimmed)) {
          const rest = trimmed.replace(/^[^:]*:\s*/, '');
          return `${cat.bn}: ${rest}`;
        }
        return cat.bn;
      }
    }
  }

  return name;
};

/**
 * Get category display name for a category id in the requested language
 */
export const getServiceCategoryTitle = (categoryId, lang = 'bn') => {
  const match = SERVICE_CATEGORIES.find(c => c.id === categoryId);
  if (!match) return categoryId || '';
  return lang === 'en' ? match.en : match.bn;
};
