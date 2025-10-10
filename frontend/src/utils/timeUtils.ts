/**
 * Utility functions for time handling with US timezone support
 */

// US timezone options
export const US_TIMEZONES = {
  EST: 'America/New_York',
  CST: 'America/Chicago', 
  MST: 'America/Denver',
  PST: 'America/Los_Angeles'
} as const;

export type USTimezone = keyof typeof US_TIMEZONES;

/**
 * Get current time in US timezone (defaults to EST/EDT)
 */
export const getUSTime = (timezone: USTimezone = 'EST'): Date => {
  const now = new Date();
  const usTime = new Date(now.toLocaleString('en-US', { 
    timeZone: US_TIMEZONES[timezone] 
  }));
  return usTime;
};

/**
 * Get current time in EST/EDT (Eastern Time)
 */
export const getESTTime = (): Date => {
  return getUSTime('EST');
};

/**
 * Format time for availability checking (HH:MM format)
 */
export const formatTimeForAvailability = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: US_TIMEZONES.EST
  });
};

/**
 * Get current day of week in lowercase (for availability matching)
 */
export const getCurrentDayOfWeek = (): string => {
  return getESTTime().toLocaleDateString('en-US', { 
    weekday: 'long',
    timeZone: US_TIMEZONES.EST
  }).toLowerCase();
};

/**
 * Check if a time is in the past (for form validation)
 */
export const isTimeInPast = (date: Date, time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const targetDateTime = new Date(date);
  targetDateTime.setHours(hours, minutes, 0, 0);
  
  const now = getESTTime();
  return targetDateTime < now;
};

/**
 * Check if a date is in the past (for form validation)
 */
export const isDateInPast = (date: Date): boolean => {
  const today = getESTTime();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Get minimum selectable date (today)
 */
export const getMinDate = (): string => {
  return getESTTime().toISOString().split('T')[0];
};

/**
 * Get minimum selectable time (current time + 1 hour, or 00:00 if date is in future)
 */
export const getMinTime = (selectedDate: string): string => {
  const selectedDateObj = new Date(selectedDate);
  const today = getESTTime();
  
  // If selected date is today, return current time + 1 hour
  if (selectedDateObj.toDateString() === today.toDateString()) {
    const currentHour = today.getHours();
    const nextHour = (currentHour + 1) % 24;
    return `${nextHour.toString().padStart(2, '0')}:00`;
  }
  
  // If selected date is in the future, allow any time
  return '00:00';
};

/**
 * Validate date and time combination
 */
export const validateDateTime = (date: string, time: string): { isValid: boolean; error?: string } => {
  const selectedDate = new Date(date);
  const selectedTime = time;
  
  // Check if date is in the past
  if (isDateInPast(selectedDate)) {
    return { isValid: false, error: 'Cannot select a date in the past' };
  }
  
  // Check if time is in the past (only for today)
  const today = getESTTime();
  if (selectedDate.toDateString() === today.toDateString() && isTimeInPast(selectedDate, selectedTime)) {
    return { isValid: false, error: 'Cannot select a time in the past' };
  }
  
  return { isValid: true };
};
