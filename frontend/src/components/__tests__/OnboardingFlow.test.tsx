import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OnboardingFlow from '../OnboardingFlow';
import { AuthProvider } from '../../context/AuthContext';

// Mock the useAuth hook
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  roles: ['driver'],
  onboardingCompleted: false
};

const mockAuthContext = {
  user: mockUser,
  isLoading: false,
  isAuthenticated: true,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  refreshToken: jest.fn(),
  retryAuth: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider value={mockAuthContext}>
      {component}
    </AuthProvider>
  );
};

describe('OnboardingFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        user: { ...mockUser, onboardingCompleted: true }
      })
    });
  });

  it('renders welcome step initially', () => {
    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={jest.fn()} />
    );

    expect(screen.getByText('Welcome to Parkway! 🚗')).toBeInTheDocument();
    expect(screen.getByText('How will you be using Parkway?')).toBeInTheDocument();
  });

  it('shows role options', () => {
    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={jest.fn()} />
    );

    expect(screen.getByText('Find Parking')).toBeInTheDocument();
    expect(screen.getByText('List Driveway')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
  });

  it('allows role selection and navigation', async () => {
    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={jest.fn()} />
    );

    // Select driver role
    const driverOption = screen.getByText('Find Parking').closest('.role-option');
    fireEvent.click(driverOption!);

    // Click continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Should show preferences step
    await waitFor(() => {
      expect(screen.getByText('Tell us about your preferences')).toBeInTheDocument();
    });
  });

  it('shows vehicle size options for driver role', async () => {
    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={jest.fn()} />
    );

    // Navigate to preferences step
    const driverOption = screen.getByText('Find Parking').closest('.role-option');
    fireEvent.click(driverOption!);
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Vehicle Size')).toBeInTheDocument();
      expect(screen.getByText('Select your vehicle size')).toBeInTheDocument();
    });
  });

  it('shows driveway size options for owner role', async () => {
    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={jest.fn()} />
    );

    // Navigate to preferences step
    const ownerOption = screen.getByText('List Driveway').closest('.role-option');
    fireEvent.click(ownerOption!);
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Driveway Size')).toBeInTheDocument();
      expect(screen.getByText('Select your driveway size')).toBeInTheDocument();
    });
  });

  it('completes onboarding flow successfully', async () => {
    const mockOnComplete = jest.fn();
    
    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={mockOnComplete} />
    );

    // Complete the flow
    const driverOption = screen.getByText('Find Parking').closest('.role-option');
    fireEvent.click(driverOption!);
    fireEvent.click(screen.getByText('Continue'));

    // Navigate through all steps
    await waitFor(() => {
      expect(screen.getByText('Tell us about your preferences')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Complete your profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText("You're all set! 🎉")).toBeInTheDocument();
    });

    // Complete onboarding
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: expect.stringContaining('onboardingCompleted')
      });
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false })
    });

    renderWithAuth(
      <OnboardingFlow isOpen={true} onComplete={jest.fn()} />
    );

    // Complete the flow quickly
    const driverOption = screen.getByText('Find Parking').closest('.role-option');
    fireEvent.click(driverOption!);
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText("You're all set! 🎉")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(screen.getByText('Failed to complete setup. Please try again.')).toBeInTheDocument();
    });
  });
});
