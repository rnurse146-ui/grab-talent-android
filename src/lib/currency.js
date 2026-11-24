// Currency helpers for talent rates — a talent can set their rates in their own
// currency, and every screen that shows a rate displays it with that symbol.

export const CURRENCIES = [
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
  { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD — Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'CAD — Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', label: 'NZD — New Zealand Dollar' },
  { code: 'CHF', symbol: 'CHF ', label: 'CHF — Swiss Franc' },
  { code: 'SEK', symbol: 'kr ', label: 'SEK — Swedish Krona' },
  { code: 'NOK', symbol: 'kr ', label: 'NOK — Norwegian Krone' },
  { code: 'DKK', symbol: 'kr ', label: 'DKK — Danish Krone' },
  { code: 'AED', symbol: 'AED ', label: 'AED — UAE Dirham' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR — South African Rand' },
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'JPY — Japanese Yen' },
  { code: 'SGD', symbol: 'S$', label: 'SGD — Singapore Dollar' },
];

export function currencySymbol(code) {
  return CURRENCIES.find(c => c.code === (code || 'GBP'))?.symbol || '£';
}

// e.g. money(450, 'EUR') → "€450"
export function money(amount, code) {
  if (amount == null || amount === '') return '';
  return `${currencySymbol(code)}${amount}`;
}