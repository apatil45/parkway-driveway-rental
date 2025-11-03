/**
 * Comprehensive tests for Footer component
 * Tests all functionality including links and copyright year
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Footer Component', () => {
  it('renders footer content', () => {
    render(<Footer />);
    
    expect(screen.getByText('Parkway')).toBeInTheDocument();
  });

  it('renders links for drivers', () => {
    render(<Footer />);
    
    expect(screen.getByText('For Drivers')).toBeInTheDocument();
    expect(screen.getByText('Find Parking')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
  });

  it('renders links for owners', () => {
    render(<Footer />);
    
    expect(screen.getByText('For Owners')).toBeInTheDocument();
    expect(screen.getByText('List Your Driveway')).toBeInTheDocument();
    expect(screen.getByText('Manage Listings')).toBeInTheDocument();
    expect(screen.getByText('View Earnings')).toBeInTheDocument();
  });

  it('renders support links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('links work correctly', () => {
    render(<Footer />);
    
    const findParkingLink = screen.getByText('Find Parking');
    expect(findParkingLink).toHaveAttribute('href', '/search');
    
    const listDrivewayLink = screen.getByText('List Your Driveway');
    expect(listDrivewayLink).toHaveAttribute('href', '/driveways/new');
  });

  it('copyright year is current year', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Parkway`))).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    const { container } = render(<Footer />);
    
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-gray-900', 'text-white', 'mt-auto');
  });

  it('has correct grid layout', () => {
    const { container } = render(<Footer />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-4');
  });
});
