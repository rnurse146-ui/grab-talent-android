// Cleans seeker-controlled booking text before it is embedded in outbound
// email or ICS content. Transactional emails are sent under the platform's
// identity, so free-text fields must never carry control characters, URLs or
// injected lines.
export function sanitizeText(value, maxLength = 200) {
  if (value == null) return '';
  return String(value)
    // Strip control characters (CR/LF, tabs) so line injection is impossible
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    // Remove markdown-style links, keeping only the visible label
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1')
    // Remove URLs so attacker text can't carry phishing links
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[link removed]')
    // Collapse whitespace left by stripped characters
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Escapes a value for use inside an ICS property per RFC 5545. Input should
// already be URL-free (sanitizeText); this preserves the escaping for
// backslash, semicolon, comma and literal newlines.
export function icsEscape(value, maxLength = 240) {
  if (value == null) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
    .slice(0, maxLength);
}