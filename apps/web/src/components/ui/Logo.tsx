'use client';

import React, { useId } from 'react';
import Link from 'next/link';

export type LogoVariant = 'icon' | 'full';
export type LogoSize = 'sm' | 'md' | 'lg';

const sizeMap = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 44, text: 'text-2xl' },
} as const;

const wordmarkDisplay = 'Parkway Spot';
const wordmarkA11y = 'Parkway Spot';

/** Parkway Spot brand: primary (navy) — from CSS vars */
const BRAND = {
  primary: 'rgb(var(--color-primary-600))',
  primaryDark: '#ffffff',
  foreground: 'rgb(var(--color-surface-foreground))',
} as const;

/**
 * Parkway Spot logo: driveway boundary + car parked inside (top view) = "book a spot on a driveway."
 * Use dark=true on dark backgrounds.
 */
export default function Logo({
  variant = 'full',
  size = 'md',
  dark = false,
  className = '',
  href = '/',
  asLink = true,
}: {
  variant?: LogoVariant;
  size?: LogoSize;
  dark?: boolean;
  className?: string;
  href?: string;
  asLink?: boolean;
}) {
  const id = useId();
  const filterId = `parkwayai-shadow-${id.replace(/:/g, '')}`;
  const { icon: iconPx, text: textClass } = sizeMap[size];
  const fillColor = dark ? BRAND.primaryDark : BRAND.primary;
  const shadowColor = dark ? '#000' : '#0f172a';
  const shadowOpacity = dark ? 0.12 : 0.06;

  const icon = (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor={shadowColor} floodOpacity={shadowOpacity} />
        </filter>
      </defs>
      <g filter={dark ? undefined : `url(#${filterId})`}>
        {/* Driveway lane (top view: curved path) */}
        <path
          fill={fillColor}
          fillRule="evenodd"
          d="M11 6L29 6Q32 6 32 9L32 31Q32 34 29 34L11 34Q8 34 8 31L8 9Q8 6 11 6ZM12 10L28 10L28 34L12 34Z"
        />
        {/* Car (top view: hood, cabin, trunk) — same color as frame for cohesion */}
        <path
          fill={fillColor}
          d="M16 16 Q20 14 24 16 L25 18 L25 28 Q20 30 15 28 L15 18 Z"
        />
      </g>
    </svg>
  );

  const textColor = dark ? BRAND.primaryDark : BRAND.foreground;
  const content = (
    <>
      {icon}
      {variant === 'full' && (
        <span
          className={`font-semibold tracking-tight ${textClass}`}
          style={{ color: textColor, letterSpacing: '-0.03em' }}
        >
          {wordmarkDisplay}
        </span>
      )}
    </>
  );

  const wrapperClass = `inline-flex items-center gap-2.5 ${className}`.trim();

  if (asLink && href) {
    return (
      <Link href={href} className={wrapperClass} aria-label={`${wordmarkA11y} home`}>
        {content}
      </Link>
    );
  }
  return <span className={wrapperClass}>{content}</span>;
}
