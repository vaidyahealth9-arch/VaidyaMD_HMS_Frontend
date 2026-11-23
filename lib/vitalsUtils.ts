/**
 * Vitals Sanitization & Normalization Utility
 * Strips repeated prefixes and trailing unit suffixes so vitals values remain clean raw numbers/tokens.
 */
export function cleanVitalValue(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Strip leading prefixes like "BP:", "BP ", "bp ", "P:", "HR:", "Pulse:"
  str = str.replace(/^(bp[:\s]*)+/i, '').trim();
  str = str.replace(/^(hr[:\s]*|pulse[:\s]*|p[:\s]*)+/i, '').trim();
  str = str.replace(/^(temp[:\s]*|t[:\s]*)+/i, '').trim();
  str = str.replace(/^(wt[:\s]*|weight[:\s]*)+/i, '').trim();
  str = str.replace(/^(ht[:\s]*|height[:\s]*)+/i, '').trim();
  str = str.replace(/^(spo2[:\s]*|o2[:\s]*)+/i, '').trim();
  str = str.replace(/^(rr[:\s]*)+/i, '').trim();

  // Strip repeated units/suffixes at the end (case-insensitive, optional whitespace)
  // Repeating loop to catch double suffixes like "bpm bpm" or "kg kg"
  let prev = '';
  while (prev !== str) {
    prev = str;
    str = str
      .replace(/\s*(mm[\s_]*hg|mmhg)\s*$/i, '')
      .replace(/\s*(bpm|beats\s*\/?\s*min)\s*$/i, '')
      .replace(/\s*(°\s*f|°\s*c|f|c|deg\s*f|deg\s*c)\s*$/i, '')
      .replace(/\s*(kg|kgs|kilograms?)\s*$/i, '')
      .replace(/\s*(cm|cms|centimeters?)\s*$/i, '')
      .replace(/\s*(%|percent)\s*$/i, '')
      .replace(/\s*(\/\s*min|\/\s*m|breaths\s*\/?\s*min|cpm)\s*$/i, '')
      .replace(/\s*(bp)\s*$/i, '')
      .trim();
  }

  return str;
}
