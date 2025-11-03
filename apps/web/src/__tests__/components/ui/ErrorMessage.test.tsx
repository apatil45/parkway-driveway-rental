/**
 * Comprehensive tests for ErrorMessage component
 * Tests all error display scenarios and retry functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '@/components/ui/ErrorMessage';

describe('ErrorMessage Component', () => {
  it('displays error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays default title', () => {
    render(<ErrorMessage message="Error message" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('displays custom title', () => {
    render(<ErrorMessage title="Custom Error" message="Error message" />);
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('handles empty errors gracefully', () => {
    const { container } = render(<ErrorMessage message="" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    // Check that message element exists even with empty string
    const messageElement = container.querySelector('p.mt-2');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement?.textContent).toBe('');
  });

  it('handles multiple error formats', () => {
    const { rerender } = render(
      <ErrorMessage message="Simple error message" />
    );
    expect(screen.getByText('Simple error message')).toBeInTheDocument();

    rerender(<ErrorMessage message="Error with details: Failed to load data" />);
    expect(screen.getByText('Error with details: Failed to load data')).toBeInTheDocument();

    rerender(<ErrorMessage message="Array error" />);
    expect(screen.getByText('Array error')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const handleRetry = jest.fn();
    render(<ErrorMessage message="Error" onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const handleRetry = jest.fn();
    render(<ErrorMessage message="Error" onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    retryButton.click();
    
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders error icon', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('has proper styling for error icon container', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    
    const iconContainer = container.querySelector('.bg-red-100');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('rounded-full');
    expect(iconContainer).toHaveClass('h-12', 'w-12');
  });

  it('has proper styling for title', () => {
    render(<ErrorMessage title="Test Error" message="Error" />);
    
    const title = screen.getByText('Test Error');
    expect(title).toHaveClass('mt-4');
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-bold');
    expect(title).toHaveClass('text-red-600');
  });

  it('has proper styling for message', () => {
    render(<ErrorMessage message="Error message" />);
    
    const message = screen.getByText('Error message');
    expect(message).toHaveClass('mt-2');
    expect(message).toHaveClass('text-gray-600');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ErrorMessage message="Error" className="custom-class" />
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('has centered layout', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('text-center');
  });
});

