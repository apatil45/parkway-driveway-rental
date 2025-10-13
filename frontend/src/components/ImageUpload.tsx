import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { notificationService } from '../services/notificationService';

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
  className?: string;
}

interface UploadedImage {
  imageUrl: string;
  publicId: string;
  width: number;
  height: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  existingImages = [],
  maxImages = 10,
  className = ''
}) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Use the new professional notification service

  const handleImagesChange = useCallback((newImages: string[]) => {
    setImages(newImages);
    onImagesChange(newImages);
  }, [onImagesChange]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      notificationService.showUploadError('Please select valid image files');
      return;
    }

    if (images.length + imageFiles.length > maxImages) {
      notificationService.showUploadError(`You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.post('/api/upload/images', formData, config);
      
      if (response.data.success) {
        const newImageUrls = response.data.imageUrls;
        const updatedImages = [...images, ...newImageUrls];
        handleImagesChange(updatedImages);
        notificationService.showUploadSuccess(imageFiles.length);
      } else {
        notificationService.showUploadError(response.data.msg || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      notificationService.showUploadError(`Failed to upload images: ${error.response?.data?.message || 'Server Error'}`);
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, handleImagesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeImage = useCallback((index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    handleImagesChange(updatedImages);
  }, [images, handleImagesChange]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`image-upload-container ${className}`}>
      <div className="image-upload-header">
        <h3>Driveway Photos</h3>
        <p>Upload up to {maxImages} photos of your driveway</p>
      </div>

      {/* Upload Area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {uploading ? (
            <div className="upload-loading">
              <div className="spinner"></div>
              <p>Uploading images...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h4>Drop images here or click to browse</h4>
              <p>Supports JPG, PNG, WebP up to 10MB each</p>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((imageUrl, index) => (
            <div key={index} className="image-preview-item">
              <img src={imageUrl} alt={`Driveway ${index + 1}`} />
              <button
                type="button"
                className="remove-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                aria-label="Remove image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tips */}
      <div className="upload-tips">
        <h4>📸 Photo Tips</h4>
        <ul>
          <li>Take photos from different angles</li>
          <li>Include the entrance and surrounding area</li>
          <li>Show any special features (covered, gated, etc.)</li>
          <li>Good lighting makes a big difference</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;
