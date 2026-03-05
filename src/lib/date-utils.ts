/**
 * Date Utilities
 * Comprehensive utilities for date manipulation and formatting
 */

import {
  format,
  parse,
  parseISO,
  isValid,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  isWeekend,
  getDay,
  setDay,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Date range type for presets
export type DateRangeType =
  | 'today'
  | 'yesterday'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'last365Days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear';

export type DateInput = Date | string | number;

/**
 * Parse a date input to Date object
 * @param date - Date input (Date, ISO string, or timestamp)
 * @returns Date object
 */
export function toDate(date: DateInput): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    // Try ISO format first
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      return parsed;
    }
    // Try Brazilian format (dd/MM/yyyy)
    const brParsed = parse(date, 'dd/MM/yyyy', new Date());
    if (isValid(brParsed)) {
      return brParsed;
    }
  }
  if (typeof date === 'number') {
    return new Date(date);
  }
  return new Date(date);
}

/**
 * Format a date for display
 * @param date - Date input
 * @param formatStr - Format string (default: 'dd/MM/yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: DateInput, formatStr: string = 'dd/MM/yyyy'): string {
  const d = toDate(date);
  if (!isValid(d)) {
    return '';
  }
  return format(d, formatStr, { locale: ptBR });
}

/**
 * Format date and time
 * @param date - Date input
 * @returns Formatted date and time string
 */
export function formatDateTime(date: DateInput): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Format date with full month name
 * @param date - Date input
 * @returns Formatted date string (e.g., "15 de Janeiro de 2024")
 */
export function formatDateLong(date: DateInput): string {
  return formatDate(date, "dd 'de' MMMM 'de' yyyy");
}

/**
 * Format date relative to today
 * @param date - Date input
 * @returns Relative date string
 */
export function formatRelativeDate(date: DateInput): string {
  const d = toDate(date);
  if (!isValid(d)) {
    return '';
  }

  if (isToday(d)) {
    return 'Hoje';
  }
  if (isYesterday(d)) {
    return 'Ontem';
  }
  if (isTomorrow(d)) {
    return 'Amanhã';
  }

  const days = differenceInDays(d, new Date());
  
  if (days > 0 && days <= 7) {
    return `Em ${days} dias`;
  }
  if (days < 0 && days >= -7) {
    return `Há ${Math.abs(days)} dias`;
  }

  const months = differenceInMonths(d, new Date());
  
  if (months > 0 && months <= 12) {
    return `Em ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  if (months < 0 && months >= -12) {
    return `Há ${Math.abs(months)} ${Math.abs(months) === 1 ? 'mês' : 'meses'}`;
  }

  return formatDate(d);
}

/**
 * Format date for API (ISO format)
 * @param date - Date input
 * @returns ISO date string (yyyy-MM-dd)
 */
export function formatDateForAPI(date: DateInput): string {
  return formatDate(date, 'yyyy-MM-dd');
}

/**
 * Format date for datetime input
 * @param date - Date input
 * @returns Datetime string for input (yyyy-MM-ddTHH:mm)
 */
export function formatDateTimeForInput(date: DateInput): string {
  return formatDate(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Get the month name
 * @param date - Date input
 * @returns Month name in Portuguese
 */
export function getMonthName(date: DateInput): string {
  return formatDate(date, 'MMMM');
}

/**
 * Get weekday name
 * @param date - Date input
 * @returns Weekday name in Portuguese
 */
export function getWeekdayName(date: DateInput): string {
  return formatDate(date, 'EEEE');
}

/**
 * Check if a date is valid
 * @param date - Date input
 * @returns Boolean indicating if date is valid
 */
export function isValidDate(date: DateInput): boolean {
  return isValid(toDate(date));
}

/**
 * Check if a date is in the past
 * @param date - Date input
 * @returns Boolean indicating if date is in the past
 */
export function isPastDate(date: DateInput): boolean {
  const d = startOfDay(toDate(date));
  const today = startOfDay(new Date());
  return isBefore(d, today);
}

/**
 * Check if a date is in the future
 * @param date - Date input
 * @returns Boolean indicating if date is in the future
 */
export function isFutureDate(date: DateInput): boolean {
  const d = startOfDay(toDate(date));
  const today = startOfDay(new Date());
  return isAfter(d, today);
}

/**
 * Check if date is overdue (past and not today)
 * @param date - Date input
 * @returns Boolean indicating if date is overdue
 */
export function isOverdue(date: DateInput): boolean {
  const d = toDate(date);
  return isPastDate(d) && !isToday(d);
}

/**
 * Check if date is due soon (within n days)
 * @param date - Date input
 * @param days - Number of days threshold
 * @returns Boolean indicating if date is due soon
 */
export function isDueSoon(date: DateInput, days: number = 7): boolean {
  const d = startOfDay(toDate(date));
  const today = startOfDay(new Date());
  const threshold = addDays(today, days);
  return isAfter(d, today) && isBefore(d, threshold);
}

/**
 * Get days until a date
 * @param date - Date input
 * @returns Number of days (negative if past)
 */
export function getDaysUntil(date: DateInput): number {
  const d = startOfDay(toDate(date));
  const today = startOfDay(new Date());
  return differenceInDays(d, today);
}

/**
 * Get days overdue
 * @param date - Date input
 * @returns Number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(date: DateInput): number {
  const days = getDaysUntil(date);
  return days < 0 ? Math.abs(days) : 0;
}

/**
 * Get date range for a period
 * @param period - Period type
 * @param referenceDate - Reference date (default: today)
 * @returns Object with start and end dates
 */
export function getDateRange(
  period: DateRangeType,
  referenceDate: DateInput = new Date()
): { start: Date; end: Date } {
  const ref = toDate(referenceDate);

  switch (period) {
    case 'today':
      return { start: startOfDay(ref), end: endOfDay(ref) };
    
    case 'yesterday':
      const yesterday = subDays(ref, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    
    case 'thisWeek':
      return { start: startOfWeek(ref, { locale: ptBR }), end: endOfWeek(ref, { locale: ptBR }) };
    
    case 'lastWeek':
      const lastWeek = subDays(startOfWeek(ref, { locale: ptBR }), 1);
      return { start: startOfWeek(lastWeek, { locale: ptBR }), end: endOfWeek(lastWeek, { locale: ptBR }) };
    
    case 'thisMonth':
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    
    case 'lastMonth':
      const lastMonth = subMonths(ref, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    
    case 'thisYear':
      return { start: startOfYear(ref), end: endOfYear(ref) };
    
    case 'lastYear':
      const lastYear = subYears(ref, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    
    case 'last7Days':
      return { start: startOfDay(subDays(ref, 6)), end: endOfDay(ref) };
    
    case 'last30Days':
      return { start: startOfDay(subDays(ref, 29)), end: endOfDay(ref) };
    
    case 'last90Days':
      return { start: startOfDay(subDays(ref, 89)), end: endOfDay(ref) };
    
    case 'last365Days':
      return { start: startOfDay(subDays(ref, 364)), end: endOfDay(ref) };
    
    case 'thisQuarter': {
      const qMonth = Math.floor(ref.getMonth() / 3) * 3;
      const qStart = new Date(ref.getFullYear(), qMonth, 1);
      const qEnd = new Date(ref.getFullYear(), qMonth + 3, 0);
      return { start: startOfDay(qStart), end: endOfDay(qEnd) };
    }
    
    case 'lastQuarter': {
      const lqMonth = Math.floor(ref.getMonth() / 3) * 3 - 3;
      const lqStart = new Date(ref.getFullYear(), lqMonth, 1);
      const lqEnd = new Date(ref.getFullYear(), lqMonth + 3, 0);
      return { start: startOfDay(lqStart), end: endOfDay(lqEnd) };
    }
    
    default:
      return { start: startOfDay(ref), end: endOfDay(ref) };
  }
}

/**
 * Get list of dates in a range
 * @param start - Start date
 * @param end - End date
 * @returns Array of dates
 */
export function getDatesInRange(start: DateInput, end: DateInput): Date[] {
  return eachDayOfInterval({
    start: toDate(start),
    end: toDate(end),
  });
}

/**
 * Get list of months in a range
 * @param start - Start date
 * @param end - End date
 * @returns Array of dates (first day of each month)
 */
export function getMonthsInRange(start: DateInput, end: DateInput): Date[] {
  return eachMonthOfInterval({
    start: toDate(start),
    end: toDate(end),
  });
}

/**
 * Get business days between two dates (excluding weekends)
 * @param start - Start date
 * @param end - End date
 * @returns Number of business days
 */
export function getBusinessDays(start: DateInput, end: DateInput): number {
  const dates = getDatesInRange(start, end);
  return dates.filter((d) => !isWeekend(d)).length;
}

/**
 * Add business days to a date
 * @param date - Start date
 * @param days - Number of business days to add
 * @returns Resulting date
 */
export function addBusinessDays(date: DateInput, days: number): Date {
  let result = toDate(date);
  let count = 0;

  while (count < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      count++;
    }
  }

  return result;
}

/**
 * Get the next occurrence of a weekday
 * @param dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @param from - Starting date (default: today)
 * @returns Date of next occurrence
 */
export function getNextWeekday(dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6, from: DateInput = new Date()): Date {
  const date = toDate(from);
  const currentDay = getDay(date);
  const diff = (dayOfWeek - currentDay + 7) % 7 || 7;
  return addDays(date, diff);
}

/**
 * Calculate age from a birthdate
 * @param birthdate - Date of birth
 * @returns Age in years
 */
export function calculateAge(birthdate: DateInput): number {
  return differenceInYears(new Date(), toDate(birthdate));
}

/**
 * Check if two dates are in the same period
 * @param date1 - First date
 * @param date2 - Second date
 * @param period - Period type
 * @returns Boolean indicating if dates are in same period
 */
export function isSamePeriod(
  date1: DateInput,
  date2: DateInput,
  period: 'day' | 'month' | 'year'
): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);

  switch (period) {
    case 'day':
      return isSameDay(d1, d2);
    case 'month':
      return isSameMonth(d1, d2);
    case 'year':
      return isSameYear(d1, d2);
    default:
      return false;
  }
}

/**
 * Get quarter from a date
 * @param date - Date input
 * @returns Quarter number (1-4)
 */
export function getQuarter(date: DateInput): 1 | 2 | 3 | 4 {
  const month = toDate(date).getMonth();
  return (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
}

/**
 * Get start and end of quarter
 * @param quarter - Quarter number (1-4)
 * @param year - Year
 * @returns Object with start and end dates
 */
export function getQuarterRange(quarter: 1 | 2 | 3 | 4, year: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = endOfMonth(new Date(year, startMonth + 2, 1));
  return { start, end };
}

/**
 * Format duration in human readable format
 * @param startDate - Start date
 * @param endDate - End date (default: now)
 * @returns Human readable duration string
 */
export function formatDuration(startDate: DateInput, endDate: DateInput = new Date()): string {
  const start = toDate(startDate);
  const end = toDate(endDate);

  const years = differenceInYears(end, start);
  if (years > 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  const months = differenceInMonths(end, start);
  if (months > 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  const days = differenceInDays(end, start);
  if (days > 0) {
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  return 'Hoje';
}

// Re-export commonly used date-fns functions
export {
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isAfter,
  isBefore,
  isEqual,
  isToday,
  isTomorrow,
  isYesterday,
  isWeekend,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
};
