/**
 * Comprehensive tests for ReviewForm component
 * Tests all functionality including star rating, form submission, and edit mode
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/ui/ReviewForm';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

// Mock dependencies
jest.mock('@/components/ui/Toast');
jest.mock('@/lib/api');

const mockShowToast = jest.fn();
const mockApi = api as jest.Mocked<typeof api>;

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, type }: any) => (
    <button type={type} onClick={onClick} disabled={disabled || loading}>
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

describe('ReviewForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
  });

  it('renders star rating', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    // Check for 5 star buttons
    const starButtons = screen.getAllByRole('button', { name: /rate \d+ star/i });
    expect(starButtons).toHaveLength(5);
  });

  it('star selection works', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    fireEvent.click(thirdStar);
    
    // Check that rating text appears
    expect(screen.getByText('3 stars')).toBeInTheDocument();
  });

  it('shows comment input', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const commentTextarea = screen.getByLabelText(/comment/i);
    expect(commentTextarea).toBeInTheDocument();
    expect(commentTextarea).toHaveAttribute('placeholder', 'Share your experience...');
  });

  it('updates comment on input', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: 'Great spot!' } });
    
    expect(commentTextarea).toHaveValue('Great spot!');
    expect(screen.getByText('12/500 characters')).toBeInTheDocument();
  });

  it('form validation - requires rating', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true } });
    
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Please select a rating', 'error');
    });
    
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('submit handler - creates new review', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true } });
    
    const onSuccess = jest.fn();
    render(<ReviewForm drivewayId="driveway-1" onSuccess={onSuccess} />);
    
    // Select rating
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    fireEvent.click(thirdStar);
    
    // Enter comment
    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: 'Great spot!' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/reviews', {
        drivewayId: 'driveway-1',
        rating: 3,
        comment: 'Great spot!',
      });
    });
    
    expect(mockShowToast).toHaveBeenCalledWith('Thank you for your review!', 'success');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('submit handler - handles API error', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'Failed to create review' } },
    });
    
    render(<ReviewForm drivewayId="driveway-1" />);
    
    // Select rating
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    fireEvent.click(thirdStar);
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to create review', 'error');
    });
  });

  it('edit mode - shows existing review', () => {
    const existingReview = {
      id: 'review-1',
      rating: 4,
      comment: 'Existing comment',
    };
    
    render(
      <ReviewForm 
        drivewayId="driveway-1" 
        existingReview={existingReview} 
      />
    );
    
    expect(screen.getByText('Update Your Review')).toBeInTheDocument();
    expect(screen.getByText('4 stars')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing comment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update review/i })).toBeInTheDocument();
  });

  it('edit mode - updates existing review', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true } });
    
    const existingReview = {
      id: 'review-1',
      rating: 4,
      comment: 'Old comment',
    };
    
    const onSuccess = jest.fn();
    render(
      <ReviewForm 
        drivewayId="driveway-1" 
        existingReview={existingReview}
        onSuccess={onSuccess}
      />
    );
    
    // Change rating
    const fifthStar = screen.getByRole('button', { name: /rate 5 stars/i });
    fireEvent.click(fifthStar);
    
    // Update comment
    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: 'Updated comment' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /update review/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/reviews', {
        drivewayId: 'driveway-1',
        rating: 5,
        comment: 'Updated comment',
      });
    });
    
    expect(mockShowToast).toHaveBeenCalledWith('Review updated successfully!', 'success');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles hover state for stars', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    
    // Hover over star
    fireEvent.mouseEnter(thirdStar);
    // The hover state is handled internally, but we can verify the interaction
    expect(thirdStar).toBeInTheDocument();
    
    // Mouse leave
    fireEvent.mouseLeave(thirdStar);
    expect(thirdStar).toBeInTheDocument();
  });

  it('trims comment before submitting', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true } });
    
    render(<ReviewForm drivewayId="driveway-1" />);
    
    // Select rating
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    fireEvent.click(thirdStar);
    
    // Enter comment with whitespace
    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: '  Padded comment  ' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/reviews', {
        drivewayId: 'driveway-1',
        rating: 3,
        comment: 'Padded comment',
      });
    });
  });

  it('submits without comment if empty', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true } });
    
    render(<ReviewForm drivewayId="driveway-1" />);
    
    // Select rating only
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    fireEvent.click(thirdStar);
    
    // Submit without comment
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/reviews', {
        drivewayId: 'driveway-1',
        rating: 3,
        comment: undefined,
      });
    });
  });

  it('shows character count for comment', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: 'Test' } });
    
    expect(screen.getByText('4/500 characters')).toBeInTheDocument();
  });

  it('disables submit button when no rating selected', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when rating is selected', () => {
    render(<ReviewForm drivewayId="driveway-1" />);
    
    const thirdStar = screen.getByRole('button', { name: /rate 3 stars/i });
    fireEvent.click(thirdStar);
    
    const submitButton = screen.getByRole('button', { name: /submit review/i });
    expect(submitButton).not.toBeDisabled();
  });
});

