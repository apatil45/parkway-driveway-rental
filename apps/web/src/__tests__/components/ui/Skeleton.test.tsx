/**
 * Comprehensive tests for Skeleton component
 * Tests all variants, sizes, and pre-built components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Skeleton, { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';

describe('Skeleton Component', () => {
  it('renders skeleton', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders rectangular variant (default)', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded');
  });

  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('h-4');
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('renders with custom width (number)', () => {
    const { container } = render(<Skeleton width={100} />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('100px');
  });

  it('renders with custom width (string)', () => {
    const { container } = render(<Skeleton width="50%" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('50%');
  });

  it('renders with custom height (number)', () => {
    const { container } = render(<Skeleton height={200} />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.height).toBe('200px');
  });

  it('renders with custom height (string)', () => {
    const { container } = render(<Skeleton height="2rem" />);
    
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.height).toBe('2rem');
  });

  it('renders text variant with lines', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines.length).toBe(3);
  });

  it('last line in text variant has reduced width', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    
    const lines = container.querySelectorAll('.animate-pulse');
    const lastLine = lines[lines.length - 1] as HTMLElement;
    expect(lastLine.style.width).toBe('75%');
  });

  it('has animation class', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('has base background color', () => {
    const { container } = render(<Skeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('bg-gray-200');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('SkeletonCard Component', () => {
  it('renders skeleton card', () => {
    const { container } = render(<SkeletonCard />);
    
    expect(container.querySelector('.card')).toBeInTheDocument();
  });

  it('has image skeleton', () => {
    const { container } = render(<SkeletonCard />);
    
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('has text skeletons', () => {
    const { container } = render(<SkeletonCard />);
    
    const textSkeletons = container.querySelectorAll('.h-4');
    expect(textSkeletons.length).toBeGreaterThan(0);
  });
});

describe('SkeletonList Component', () => {
  it('renders skeleton list with default count', () => {
    const { container } = render(<SkeletonList />);
    
    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBe(3); // Default count
  });

  it('renders skeleton list with custom count', () => {
    const { container } = render(<SkeletonList count={5} />);
    
    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBe(5);
  });

  it('has spacing between items', () => {
    const { container } = render(<SkeletonList />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('space-y-4');
  });
});

