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
  scheduled:   'bg-blue-50   text-blue-700   border-blue-200',
  waiting:     'bg-amber-50  text-amber-700  border-amber-200',
  in_progress: 'bg-teal-50   text-teal-700   border-teal-200',
  completed:   'bg-slate-50  text-slate-500  border-slate-200',
  cancelled:   'bg-red-50    text-red-600    border-red-200',
  no_show:     'bg-red-50    text-red-600    border-red-200',
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
};

/** Role color classes */
export const roleColors: Record<string, string> = {
  admin:         'bg-purple-100  text-purple-700',
  doctor:        'bg-teal-100    text-teal-800',
  nurse:         'bg-pink-100    text-pink-700',
  receptionist:  'bg-sky-100     text-sky-700',
  embryologist:  'bg-emerald-100 text-emerald-700',
  andrologist:   'bg-cyan-100    text-cyan-700',
  pharma:        'bg-orange-100  text-orange-700',
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
