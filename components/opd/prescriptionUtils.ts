/**
 * Prescription formatting utilities and constants
 * Standardizes clinical medication frequency and food timing instructions.
 */

export const STANDARD_FREQUENCIES = [
  '1-0-1',
  '1-0-0',
  '0-1-0',
  '0-0-1',
  '1-1-1',
  '1-1-0',
  '0-1-1',
  '1-1-1-1',
  'SOS',
  'Stat',
] as const;

export const FOOD_TIMING_PRESETS = [
  { code: 'AF', label: 'After Food' },
  { code: 'BF', label: 'Before Food' },
  { code: 'WF', label: 'With Food' },
  { code: 'ES', label: 'Empty Stomach' },
  { code: 'HS', label: 'Bedtime' },
] as const;

/**
 * Normalizes frequency strings to hyphenated numeric notation or clean custom text.
 * Converts legacy abbreviations (OD, BD, TDS, QID) to hyphenated format.
 */
export function formatFrequency(raw?: string | null): string {
  if (!raw) return '1-0-1';
  const val = raw.trim();
  const upper = val.toUpperCase();

  switch (upper) {
    case 'OD':
    case '1-0-0 (ONCE DAILY)':
      return '1-0-0';
    case 'BD':
    case 'BID':
    case '1-0-1 (TWICE DAILY)':
      return '1-0-1';
    case 'TDS':
    case 'TID':
    case '1-1-1 (THRICE DAILY)':
      return '1-1-1';
    case 'QID':
    case '1-1-1-1 (FOUR TIMES DAILY)':
      return '1-1-1-1';
    case 'HS':
      return '0-0-1';
    default:
      // Remove any parenthesized descriptions e.g. "1-0-1 (Morning - Night)" -> "1-0-1"
      if (/^\d+-\d+-\d+/.test(val)) {
        const match = val.match(/^\d+-\d+-\d+(-\d+)?/);
        return match ? match[0] : val;
      }
      return val;
  }
}
