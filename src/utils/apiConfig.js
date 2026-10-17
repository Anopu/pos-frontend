// FC Technology POS - Dynamic API Base URL Configuration
// লোকাল কম্পিউটার, ওয়াই-ফাই নেটওয়ার্ক এবং লাইভ ডোমেন (fctechbd.com) স্বয়ংক্রিয়ভাবে হ্যান্ডেল করার জন্য

export const getApiBase = () => {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5010/api';
  }

  const { hostname, protocol, origin } = window.location;
  const currentOrigin = origin || `${protocol}//${window.location.host}`;

  // যখন fctechbd.com বা লাইভ ডোমেন থেকে চালানো হবে
  if (hostname.includes('fctechbd.com') || (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.') && !hostname.startsWith('10.') && !hostname.startsWith('172.'))) {
    return `${currentOrigin}/api`;
  }

  // লোকাল মেশিন অথবা ওয়াই-ফাই নেটওয়ার্ক (127.0.0.1, localhost, 192.168.x.x)
  const host = hostname || '127.0.0.1';
  return `http://${host}:5010/api`;
};

export const API_BASE = getApiBase();

/**
 * Safely parse fetch response as JSON.
 * If the response is HTML or plain text (e.g. from server error or 404/500/502),
 * this extracts a readable error message instead of throwing "Unexpected token <... is not valid JSON".
 */
export const safeJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      // Fall through to text parsing
    }
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const cleanSnippet = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
    throw new Error(
      !response.ok
        ? `Server Error (${response.status}): ${cleanSnippet || response.statusText}`
        : `Invalid response from server: ${cleanSnippet || text.slice(0, 100)}`
    );
  }
};

