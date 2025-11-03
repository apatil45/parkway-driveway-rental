/**
 * Comprehensive tests for LoadingSpinner component
 * Tests all sizes, text, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders medium size (default)', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('renders large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders extra large size', () => {
    const { container } = render(<LoadingSpinner size="xl" />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-32', 'w-32');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render text when not provided', () => {
    const { container } = render(<LoadingSpinner />);
    
    const text = container.querySelector('p');
    expect(text).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('has proper animation classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('rounded-full');
    expect(spinner).toHaveClass('border-b-2');
    expect(spinner).toHaveClass('border-primary-600');
  });

  it('has proper layout classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });

  it('text has proper styling', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('mt-2');
    expect(text).toHaveClass('text-sm');
    expect(text).toHaveClass('text-gray-600');
  });
});

