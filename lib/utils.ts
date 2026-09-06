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
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  waiting: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
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
  admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-indigo-100 text-indigo-700',
  nurse: 'bg-pink-100 text-pink-700',
  receptionist: 'bg-cyan-100 text-cyan-700',
  embryologist: 'bg-emerald-100 text-emerald-700',
  andrologist: 'bg-teal-100 text-teal-700',
  pharma: 'bg-orange-100 text-orange-700',
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
