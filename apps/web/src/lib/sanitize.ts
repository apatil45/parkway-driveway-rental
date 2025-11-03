/**
 * XSS Sanitization Utilities
 * 
 * Sanitizes user input to prevent XSS attacks in HTML contexts
 * Particularly important for email templates and user-generated content
 */

/**
 * Escape HTML special characters
 * Prevents XSS in HTML contexts
 */
export function escapeHtml(text: string | number | undefined | null): string {
  if (text === null || text === undefined) {
    return '';
  }
  
  const str = String(text);
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize string for use in HTML attributes
 */
export function escapeAttribute(text: string | number | undefined | null): string {
  return escapeHtml(text).replace(/\n/g, ' ').trim();
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = escapeHtml(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Sanitize array of strings
 */
export function sanitizeArray(arr: (string | number | undefined | null)[]): string[] {
  return arr.map(item => escapeHtml(item)).filter(Boolean) as string[];
}

