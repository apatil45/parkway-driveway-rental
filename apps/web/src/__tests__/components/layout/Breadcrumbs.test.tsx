/**
 * Comprehensive tests for Breadcrumbs component
 * Tests all functionality including navigation and dynamic segments
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Breadcrumbs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders breadcrumb trail', () => {
    mockUsePathname.mockReturnValue('/driveways/new');
    
    render(<Breadcrumbs />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Driveways')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    mockUsePathname.mockReturnValue('/driveways/123/edit');
    
    render(<Breadcrumbs />);
    
    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveAttribute('href', '/driveways');
    
    const drivewaysLink = screen.getByText('Driveways');
    expect(drivewaysLink).toHaveAttribute('href', '/driveways');
  });

  it('renders home link', () => {
    mockUsePathname.mockReturnValue('/search');
    
    render(<Breadcrumbs />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveAttribute('href', '/search');
  });

  it('handles dynamic segments', () => {
    mockUsePathname.mockReturnValue('/driveways/abc123/details');
    
    render(<Breadcrumbs />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Driveways')).toBeInTheDocument();
    expect(screen.getByText('Abc123')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('does not render on shallow pages', () => {
    mockUsePathname.mockReturnValue('/');
    
    const { container } = render(<Breadcrumbs />);
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render on login page', () => {
    mockUsePathname.mockReturnValue('/login');
    
    const { container } = render(<Breadcrumbs />);
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render on register page', () => {
    mockUsePathname.mockReturnValue('/register');
    
    const { container } = render(<Breadcrumbs />);
    
    expect(container.firstChild).toBeNull();
  });

  it('formats path segments correctly', () => {
    mockUsePathname.mockReturnValue('/my-bookings');
    
    render(<Breadcrumbs />);
    
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
  });

  it('shows last segment as non-link', () => {
    mockUsePathname.mockReturnValue('/driveways/new');
    
    render(<Breadcrumbs />);
    
    const lastSegment = screen.getByText('New');
    expect(lastSegment.tagName).toBe('SPAN');
    expect(lastSegment).toHaveClass('text-gray-900', 'font-medium');
  });

  it('shows earlier segments as links', () => {
    mockUsePathname.mockReturnValue('/driveways/new');
    
    render(<Breadcrumbs />);
    
    const homeLink = screen.getByText('Home');
    expect(homeLink.tagName).toBe('A');
    
    const drivewaysLink = screen.getByText('Driveways');
    expect(drivewaysLink.tagName).toBe('A');
  });

  it('has proper styling classes', () => {
    mockUsePathname.mockReturnValue('/search');
    
    const { container } = render(<Breadcrumbs />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-gray-50', 'border-b', 'border-gray-200');
    
    const ol = container.querySelector('ol');
    expect(ol).toHaveClass('flex', 'items-center', 'space-x-2', 'text-sm');
  });

  it('has aria-label for accessibility', () => {
    mockUsePathname.mockReturnValue('/search');
    
    const { container } = render(<Breadcrumbs />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });
});
