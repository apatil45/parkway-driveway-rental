/**
 * Format a Date for <input type="datetime-local"> (local time).
 */
export function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Default start = now (rounded to next 15 min), end = start + 1 hour.
 */
export function getDefaultStartEnd(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: toDateTimeLocal(start), end: toDateTimeLocal(end) };
}

/**
 * Minimum value for datetime-local inputs (no past times).
 */
export function getDateTimeLocalMin(): string {
  return toDateTimeLocal(new Date());
}

/**
 * Clamp start time to be at least the current time.
 * Use for any start-time input: effective value = max(current time, user input).
 * @param userInput - datetime-local string (YYYY-MM-DDTHH:mm) or empty
 * @returns datetime-local string, or empty if userInput is empty
 */
export function clampStartTimeToNow(userInput: string): string {
  if (!userInput || !userInput.trim()) return userInput;
  const now = new Date();
  let parsed: Date;
  if (userInput.includes('T')) {
    parsed = new Date(userInput);
  } else {
    parsed = new Date(userInput + 'T00:00:00');
  }
  if (Number.isNaN(parsed.getTime())) return userInput;
  const clamped = parsed.getTime() < now.getTime() ? now : parsed;
  return toDateTimeLocal(clamped);
}
