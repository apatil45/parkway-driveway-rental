'use client';

import { useState, useRef } from 'react';
import Button from './Button';
import api from '@/lib/api';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUpload({ 
  value = [], 
  onChange, 
  maxImages = 5,
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if we're at max images
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check if adding these files would exceed max
    const remainingSlots = maxImages - value.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploading(true);
    setError('');

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data?.data?.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(Boolean) as string[];
      
      onChange([...value, ...validUrls]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleReplace = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newUrl = response.data?.data?.url;
      if (newUrl) {
        const newUrls = [...value];
        newUrls[index] = newUrl;
        onChange(newUrls);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images {value.length > 0 && `(${value.length}/${maxImages})`}
        </label>
        
        {value.length < maxImages && (
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple={maxImages > 1}
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
              id="image-upload-input"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || uploading}
              className="cursor-pointer"
              onClick={() => {
                if (fileInputRef.current && !disabled && !uploading) {
                  fileInputRef.current.click();
                }
              }}
            >
              {uploading ? 'Uploading...' : `Upload ${maxImages > 1 ? 'Images' : 'Image'}`}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WebP, or GIF (max 10MB each)
            </p>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm mb-2">{error}</div>
        )}
      </div>

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Driveway ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={(e) => handleReplace(index, e)}
                    disabled={disabled || uploading}
                    className="hidden"
                    id={`replace-image-${index}`}
                    ref={(el) => {
                      if (el) {
                        replaceInputRefs.current.set(index, el);
                      } else {
                        replaceInputRefs.current.delete(index);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={disabled || uploading}
                    className="cursor-pointer"
                    onClick={() => {
                      const input = replaceInputRefs.current.get(index);
                      if (input && !disabled && !uploading) {
                        input.click();
                      }
                    }}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    disabled={disabled || uploading}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: Manual URL input if Cloudinary not configured */}
      {value.length === 0 && (
        <div className="text-sm text-gray-500">
          <p>Upload images using the button above, or enter URLs manually below:</p>
        </div>
      )}
    </div>
  );
}

