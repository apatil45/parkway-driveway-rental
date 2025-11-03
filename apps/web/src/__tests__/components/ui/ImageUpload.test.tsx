/**
 * Comprehensive tests for ImageUpload component
 * Tests all functionality including file selection, upload, preview, and removal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUpload from '@/components/ui/ImageUpload';
import api from '@/lib/api';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('ImageUpload Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnChange.mockClear();
  });

  it('renders upload button', () => {
    render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('handles file selection', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { url: 'https://example.com/image1.jpg' } },
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        '/upload/image',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/image1.jpg']);
    });
  });

  it('shows preview for uploaded images', () => {
    const urls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];
    
    render(<ImageUpload value={urls} onChange={mockOnChange} />);
    
    const images = screen.getAllByAltText(/Driveway/i);
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', urls[0]);
    expect(images[1]).toHaveAttribute('src', urls[1]);
  });

  it('shows upload progress (uploading state)', async () => {
    mockApi.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { data: { url: 'url' } } }), 100))
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('error handling - displays error message', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'Upload failed' } },
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('file type validation - accepts valid image types', () => {
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/webp,image/gif');
  });

  it('file size validation - shows error for large files', async () => {
    // Note: Actual file size validation might be done server-side
    // This test verifies the component handles errors properly
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'File too large' } },
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });
  });

  it('multiple images - handles multiple file uploads', async () => {
    mockApi.post
      .mockResolvedValueOnce({ data: { data: { url: 'https://example.com/image1.jpg' } } })
      .mockResolvedValueOnce({ data: { data: { url: 'https://example.com/image2.jpg' } } });

    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];
    
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} maxImages={5} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ]);
    });
  });

  it('enforces max images limit', async () => {
    const existingUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
      'https://example.com/image4.jpg',
      'https://example.com/image5.jpg',
    ];

    render(<ImageUpload value={existingUrls} onChange={mockOnChange} maxImages={5} />);
    
    // Upload button should not be visible when at max
    expect(screen.queryByText('Upload Image')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload Images')).not.toBeInTheDocument();
  });

  it('shows error when trying to exceed max images', async () => {
    const existingUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
      'https://example.com/image4.jpg',
    ];

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(
      <ImageUpload value={existingUrls} onChange={mockOnChange} maxImages={5} />
    );
    
    // Add one more to reach max
    mockApi.post.mockResolvedValue({ data: { data: { url: 'https://example.com/image5.jpg' } } });
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    // Now try to add another one
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', {
      value: [file2],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Maximum 5 images allowed')).toBeInTheDocument();
    });
  });

  it('handles remove image', () => {
    const urls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];
    
    render(<ImageUpload value={urls} onChange={mockOnChange} />);
    
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/image2.jpg']);
  });

  it('handles replace image', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { url: 'https://example.com/new-image.jpg' } },
    });

    const urls = ['https://example.com/image1.jpg'];
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(<ImageUpload value={urls} onChange={mockOnChange} />);
    
    const replaceInput = container.querySelector('input[id="replace-image-0"]') as HTMLInputElement;
    Object.defineProperty(replaceInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(replaceInput);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/new-image.jpg']);
    });
  });

  it('disables input when disabled prop is true', () => {
    const { container } = render(
      <ImageUpload value={[]} onChange={mockOnChange} disabled />
    );
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('disables input when uploading', async () => {
    mockApi.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { data: { url: 'url' } } }), 100))
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(input).toBeDisabled();
    });
  });

  it('shows image count in label', () => {
    const urls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];
    
    render(<ImageUpload value={urls} onChange={mockOnChange} maxImages={5} />);
    
    expect(screen.getByText(/Images \(2\/5\)/)).toBeInTheDocument();
  });

  it('shows correct button text for single vs multiple images', () => {
    const { rerender } = render(
      <ImageUpload value={[]} onChange={mockOnChange} maxImages={1} />
    );
    
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    
    rerender(<ImageUpload value={[]} onChange={mockOnChange} maxImages={5} />);
    expect(screen.getByText('Upload Images')).toBeInTheDocument();
  });

  it('filters out invalid URLs from upload response', async () => {
    mockApi.post
      .mockResolvedValueOnce({ data: { data: { url: 'https://example.com/image1.jpg' } } })
      .mockResolvedValueOnce({ data: { data: { url: null } } }) // Invalid URL
      .mockResolvedValueOnce({ data: { data: { url: 'https://example.com/image3.jpg' } } });

    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
    ];
    
    const { container } = render(<ImageUpload value={[]} onChange={mockOnChange} />);
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
      ]);
    });
  });
});
