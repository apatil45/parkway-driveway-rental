/**
 * Tests for XSS sanitization utilities
 */

import { escapeHtml, escapeAttribute, sanitizeObject, sanitizeArray } from '@/lib/sanitize';

describe('Sanitize Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"double" and \'single\' quotes')).toBe(
        '&quot;double&quot; and &#039;single&#039; quotes'
      );
    });

    it('should handle null and undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(0)).toBe('0');
    });

    it('should handle safe strings', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should escape all dangerous characters', () => {
      const input = '<>&"\'/';
      const output = escapeHtml(input);
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      // Note: & is converted to &amp;, so we check for the escaped version
      expect(output).toContain('&amp;');
      expect(output).not.toContain('"');
      expect(output).not.toContain("'");
      expect(output).not.toContain('/');
    });
  });

  describe('escapeAttribute', () => {
    it('should escape HTML and remove newlines', () => {
      expect(escapeAttribute('<img src="x">\n')).toBe('&lt;img src=&quot;x&quot;&gt;');
    });

    it('should trim whitespace', () => {
      expect(escapeAttribute('  test  ')).toBe('test');
    });

    it('should handle null and undefined', () => {
      expect(escapeAttribute(null)).toBe('');
      expect(escapeAttribute(undefined)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string properties', () => {
      const input = {
        title: '<script>alert("xss")</script>',
        description: 'Safe text',
        count: 42
      };

      const output = sanitizeObject(input);

      expect(output.title).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(output.description).toBe('Safe text');
      expect(output.count).toBe(42);
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          email: 'test@example.com'
        }
      };

      const output = sanitizeObject(input);

      expect(output.user.name).toBe('&lt;b&gt;John&lt;&#x2F;b&gt;');
      expect(output.user.email).toBe('test@example.com');
    });

    it('should handle null values', () => {
      const input = {
        title: null,
        description: undefined
      };

      const output = sanitizeObject(input);

      expect(output.title).toBeNull();
      expect(output.description).toBeUndefined();
    });
  });

  describe('sanitizeArray', () => {
    it('should sanitize all array elements', () => {
      const input = ['<script>', 'safe', '&amp;', 123];
      const output = sanitizeArray(input);

      expect(output[0]).toBe('&lt;script&gt;');
      expect(output[1]).toBe('safe');
      expect(output[2]).toBe('&amp;amp;');
      expect(output[3]).toBe('123');
    });

    it('should filter out null and undefined', () => {
      const input = ['test', null, undefined, 'value'];
      const output = sanitizeArray(input);

      expect(output.length).toBe(2);
      expect(output[0]).toBe('test');
      expect(output[1]).toBe('value');
    });

    it('should handle empty array', () => {
      expect(sanitizeArray([])).toEqual([]);
    });
  });
});

