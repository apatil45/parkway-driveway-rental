'use client';

import { ReactNode } from 'react';

/**
 * Renders children only in development. Use for debug/error badges (e.g. "1 Issue" widget).
 * In production this returns null so no debug UI is shown.
 */
export function DebugOnly({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== 'development') return null;
  return <>{children}</>;
}
