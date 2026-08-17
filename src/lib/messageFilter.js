// Detects attempts to share phone numbers and social media handles in messages.
// Used to block off-app contact exchange until a booking is confirmed (hired) through Grab Talent.

// Matches runs of 7+ digits, optionally separated by spaces, dashes, dots or parentheses.
const PHONE_REGEX = /\b\d[\d\s\-().]{6,}\d\b/;

const SOCIAL_REGEXES = [
  /@[a-zA-Z0-9._]{2,30}\b/, // @handles (instagram, twitter/x, tiktok, snapchat, etc.)
  /\binsta(gram)?\b/i,
  /\bfacebook\b/i,
  /\bsnapchat\b/i,
  /\btiktok\b/i,
  /\btwitter\b/i,
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bt\.me\b/i,
  /\bwa\.me\b/i,
  /https?:\/\/(www\.)?(instagram|facebook|snapchat|tiktok|twitter|x\.com|wa\.me|t\.me|youtube|linkedin)\b/i,
];

export function containsContactInfo(text) {
  const reasons = [];
  if (!text) return { blocked: false, reasons };
  if (PHONE_REGEX.test(text)) reasons.push('a phone number');
  SOCIAL_REGEXES.forEach((re) => { if (re.test(text)) reasons.push('social media details'); });
  return { blocked: reasons.length > 0, reasons: [...new Set(reasons)] };
}