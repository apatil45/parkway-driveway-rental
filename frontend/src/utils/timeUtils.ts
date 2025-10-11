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
  // Use Intl.DateTimeFormat to get proper timezone conversion
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: US_TIMEZONES[timezone],
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  const hour = parts.find(part => part.type === 'hour')?.value;
  const minute = parts.find(part => part.type === 'minute')?.value;
  const second = parts.find(part => part.type === 'second')?.value;
  
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
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
 * Format time for display in 12-hour format (for user-friendly display)
 */
export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: 'numeric', 
    minute: '2-digit',
    timeZone: US_TIMEZONES.EST
  });
};

/**
 * Convert 24-hour time string to 12-hour format for display
 */
export const convertTo12HourFormat = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return formatTimeForDisplay(date);
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
  
  // Compare only the time portion, not the full datetime
  const targetTime = hours * 60 + minutes;
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  return targetTime < currentTime;
};

/**
 * Check if a date is in the past (for form validation)
 */
export const isDateInPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const today = getESTTime();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  
  // Compare dates in the same timezone
  const todayStr = today.toISOString().split('T')[0];
  const dateStr = dateObj.toISOString().split('T')[0];
  
  return dateStr < todayStr;
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
    const nextHour = currentHour + 1;
    // If next hour is 24, it should be 00 (midnight)
    const finalHour = nextHour >= 24 ? 0 : nextHour;
    return `${finalHour.toString().padStart(2, '0')}:00`;
  }
  
  // If selected date is in the future, allow any time
  return '00:00';
};

/**
 * Validate date and time combination
 */
export const validateDateTime = (date: string, time: string): { isValid: boolean; error?: string } => {
  console.log('Validating date/time:', { date, time });
  
  // Check if date is in the past
  if (isDateInPast(date)) {
    console.log('Date is in past:', date);
    return { isValid: false, error: 'Cannot select a date in the past' };
  }
  
  // Check if time is in the past (only for today)
  const today = getESTTime();
  const selectedDate = new Date(date + 'T00:00:00');
  
  // Compare date strings to avoid timezone issues
  const todayStr = today.toISOString().split('T')[0];
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  console.log('Date comparison:', { todayStr, selectedDateStr, isToday: selectedDateStr === todayStr });
  
  if (selectedDateStr === todayStr && isTimeInPast(selectedDate, time)) {
    console.log('Time is in past for today');
    return { isValid: false, error: 'Cannot select a time in the past' };
  }
  
  console.log('Validation passed');
  return { isValid: true };
};

/**
 * Duration options for Park Now mode
 */
export const DURATION_OPTIONS = [
  { value: 30, label: '30 min', display: '30 minutes' },
  { value: 60, label: '1 hr', display: '1 hour' },
  { value: 120, label: '2 hr', display: '2 hours' },
  { value: 240, label: '4 hr', display: '4 hours' },
  { value: 480, label: '8 hr', display: '8 hours' }
] as const;

/**
 * Calculate end time for Park Now mode
 */
export const calculateEndTime = (durationMinutes: number): { startTime: string; endTime: string } => {
  const now = getESTTime();
  const endTime = new Date(now.getTime() + (durationMinutes * 60 * 1000));
  
  return {
    startTime: formatTimeForAvailability(now),
    endTime: formatTimeForAvailability(endTime)
  };
};

/**
 * Format duration for display
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

/**
 * Get current time display for Park Now mode
 */
export const getCurrentTimeDisplay = (): string => {
  const now = getESTTime();
  return formatTimeForDisplay(now);
};
