import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees (displays paise if fractional, or clean whole rupees if integer) */
export function formatCurrency(amount: number | string, forceDecimals?: boolean): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const val = Number(num) || 0;
  const hasDecimals = forceDecimals ?? (Math.abs(val - Math.round(val)) > 0.001);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(val);
}

/** Canonical Clinical Timezone for Indian Healthcare Operations */
export const CLINICAL_TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Returns today's calendar date as YYYY-MM-DD in Indian Standard Time (IST).
 * Prevents UTC midnight boundary rollbacks where Indian local time between 00:00 and 05:30
 * is still the previous day in UTC.
 */
export function getTodayIst(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINICAL_TIMEZONE_IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Formats as YYYY-MM-DD
}

/**
 * Returns a given date or today formatted as YYYY-MM-DD in Indian Standard Time (IST).
 */
export function formatDateToIst(date?: Date | string | null): string {
  if (!date) return getTodayIst();
  const d = date instanceof Date ? date : parseUtcDate(date);
  if (!d || isNaN(d.getTime())) return getTodayIst();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINICAL_TIMEZONE_IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Format a time for display in the client's system timezone (hh:mm A) */
export function formatTime(date: string | Date | null | undefined): string {
  const parsed = parseUtcDate(date);
  if (!parsed || isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

/** Parse a date string safely into a Date object, treating naive ISO strings from UTC backend as UTC */
export function parseUtcDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return null;
    // YYYY-MM-DD date only
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // Datetime without explicit timezone indicator (naive UTC from server)
    const normalized = trimmed.replace(' ', 'T');
    if (!normalized.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(normalized)) {
      return new Date(normalized + 'Z');
    }
    return new Date(normalized);
  }
  return new Date(date);
}

/** Format a date for display */
export function formatDate(date: string | Date | null | undefined): string {
  const parsed = parseUtcDate(date);
  if (!parsed || isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

/** Format a datetime for display */
export function formatDateTime(date: string | Date | null | undefined): string {
  const parsed = parseUtcDate(date);
  if (!parsed || isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Calculate BMI */
export function calculateBMI(weightKg: number, heightCm: number): string {
  if (!weightKg || !heightCm) return '';
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
}

/** Status color map for appointment statuses */
export const statusColors: Record<string, string> = {
  scheduled:   'bg-info-bg text-info border-info/20',
  waiting:     'bg-warning-bg text-warning border-warning/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  completed:   'bg-success-bg text-success border-success/20',
  cancelled:   'bg-danger-bg text-danger border-danger/20',
  no_show:     'bg-danger-bg text-danger border-danger/20',
};

export const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  waiting: 'Waiting',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

/** Role display labels */
export const roleLabels: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  embryologist: 'Embryologist',
  andrologist: 'Andrologist',
  pharma: 'Pharmacist',
  counsellor: 'Counselor',
  accounts: 'Accounts',
};

/** Role color classes */
export const roleColors: Record<string, string> = {
  admin:         'bg-accent/20 text-accent border border-accent/30 font-semibold',
  doctor:        'bg-primary/10 text-primary border border-primary/20 font-semibold',
  nurse:         'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
  receptionist:  'bg-sky-50 text-sky-700 border border-sky-200 font-semibold',
  embryologist:  'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
  andrologist:   'bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold',
  pharma:        'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
  counsellor:    'bg-purple-50 text-purple-700 border border-purple-200 font-semibold',
  accounts:      'bg-slate-100 text-slate-700 border border-slate-200 font-semibold',
};

/** Check if a user role can access a field */
export function canAccessField(fieldRoles: string[] | undefined, userRole: string): boolean {
  if (!fieldRoles || fieldRoles.length === 0) return true;
  return fieldRoles.includes(userRole);
}

/** Truncate text to N characters */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format user role display:
 * - If admin and is_doctor: "Admin + Doctor"
 * - If admin and not is_doctor: "Admin only"
 * - Otherwise: standard role label
 */
export function getUserRoleDisplay(user: { role?: string; is_doctor?: boolean } | null | undefined): string {
  if (!user || !user.role) return 'Staff';
  const roleLower = user.role.toLowerCase();
  if (roleLower === 'admin') {
    return user.is_doctor ? 'Admin + Doctor' : 'Admin only';
  }
  return roleLabels[roleLower] || user.role;
}

/**
 * Determine if a user can act as a treating doctor.
 * Admin cannot be doctor default, but can if is_doctor is true.
 */
export function isUserDoctor(user: { role?: string; is_doctor?: boolean } | null | undefined): boolean {
  if (!user) return false;
  const roleLower = (user.role || '').toLowerCase();
  if (roleLower === 'doctor') return true;
  if (roleLower === 'admin') return Boolean(user.is_doctor);
  return Boolean(user.is_doctor);
}


/**
 * Converts a numeric amount to Indian currency words (e.g. 15000 -> "Rupees Fifteen Thousand Only")
 */
export function amountInWords(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n: number): string => {
    if (n < 20) return a[n];
    return `${b[Math.floor(n / 10)]} ${a[n % 10]}`.trim();
  };

  const convertThreeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const hStr = h > 0 ? `${a[h]} Hundred` : '';
    const remStr = rem > 0 ? convertTwoDigits(rem) : '';
    return [hStr, remStr].filter(Boolean).join(' and ');
  };

  const integerPart = Math.floor(num);
  const paisePart = Math.round((num - integerPart) * 100);

  let str = '';
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  if (crore > 0) str += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) str += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) str += `${convertTwoDigits(thousand)} Thousand `;
  if (remainder > 0) str += convertThreeDigits(remainder);

  str = str.trim();
  if (!str) str = 'Zero';

  let res = `Rupees ${str}`;
  if (paisePart > 0) {
    res += ` and ${convertTwoDigits(paisePart)} Paise`;
  }
  return `${res} Only`;
}
