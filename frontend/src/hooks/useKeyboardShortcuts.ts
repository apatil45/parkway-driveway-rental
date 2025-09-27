import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common keyboard shortcuts for the application
export const commonShortcuts: KeyboardShortcut[] = [
  {
    key: '/',
    action: () => {
      const searchInput = document.querySelector('input[type="text"], input[placeholder*="search" i], input[placeholder*="address" i]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Focus search input',
    preventDefault: false
  },
  {
    key: 'Escape',
    action: () => {
      // Close any open modals
      const modals = document.querySelectorAll('.modal, [role="dialog"]');
      modals.forEach(modal => {
        const closeButton = modal.querySelector('[aria-label="close"], .close-button, [data-dismiss="modal"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      });
    },
    description: 'Close modals/dialogs'
  },
  {
    key: 'Enter',
    ctrlKey: true,
    action: () => {
      // Submit forms
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.tagName === 'INPUT') {
        const form = activeElement.closest('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton) {
            submitButton.click();
          }
        }
      }
    },
    description: 'Submit form (Ctrl+Enter)'
  }
];
