import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/** Format a date for display */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format a datetime for display */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
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
