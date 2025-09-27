/**
 * Robust Driveway Service with retry logic, validation, and comprehensive error handling
 */

import axios from 'axios';
import { retryWithBackoff } from '../utils/retryUtils';
import { notificationService } from './notificationService';

export interface DrivewayRequest {
  address: string;
  description: string;
  images: string[];
  availability: Array<{
    date: string;
    startTime: string;
    endTime: string;
    pricePerHour: number;
  }>;
  carSizeCompatibility: string[];
  drivewaySize: string;
  amenities?: string[];
  isAvailable?: boolean;
}

export interface DrivewayResponse {
  id: string;
  message?: string;
}

export interface DrivewayValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class RobustDrivewayService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * Validate driveway request before submission
   */
  validateDrivewayRequest(request: DrivewayRequest): DrivewayValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!request.address || request.address.trim().length < 5) {
      errors.push('Address must be at least 5 characters long');
    }
    if (!request.description || request.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    if (!request.drivewaySize) {
      errors.push('Driveway size is required');
    }
    if (!request.carSizeCompatibility || request.carSizeCompatibility.length === 0) {
      errors.push('At least one car size compatibility must be selected');
    }

    // Availability validation
    if (!request.availability || request.availability.length === 0) {
      errors.push('At least one availability slot is required');
    } else {
      request.availability.forEach((slot, index) => {
        if (!slot.date) {
          errors.push(`Availability slot ${index + 1}: Date is required`);
        }
        if (!slot.startTime) {
          errors.push(`Availability slot ${index + 1}: Start time is required`);
        }
        if (!slot.endTime) {
          errors.push(`Availability slot ${index + 1}: End time is required`);
        }
        if (!slot.pricePerHour || slot.pricePerHour <= 0) {
          errors.push(`Availability slot ${index + 1}: Valid price per hour is required`);
        }

        // Time validation
        if (slot.startTime && slot.endTime) {
          const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
          const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
          
          if (startTime >= endTime) {
            errors.push(`Availability slot ${index + 1}: End time must be after start time`);
          }
        }

        // Price validation
        if (slot.pricePerHour > 100) {
          warnings.push(`Availability slot ${index + 1}: Price per hour exceeds $100`);
        }
        if (slot.pricePerHour < 1) {
          warnings.push(`Availability slot ${index + 1}: Price per hour is very low`);
        }
      });
    }

    // Image validation
    if (!request.images || request.images.length === 0) {
      warnings.push('No images provided - consider adding photos to attract more bookings');
    } else if (request.images.length > 8) {
      errors.push('Maximum 8 images allowed');
    }

    // Date validation for availability slots
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    request.availability?.forEach((slot, index) => {
      const slotDate = new Date(slot.date);
      if (slotDate < today) {
        errors.push(`Availability slot ${index + 1}: Date cannot be in the past`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create driveway with retry logic and comprehensive error handling
   */
  async createDriveway(request: DrivewayRequest): Promise<DrivewayResponse> {
    // Validate request first
    const validation = this.validateDrivewayRequest(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        notificationService.showNotification({
          type: 'warning',
          title: 'Driveway Warning',
          message: warning,
          context: 'system',
          duration: 5000
        });
      });
    }

    const drivewayData = {
      ...request,
      isAvailable: request.isAvailable ?? true
    };

    try {
      const response = await retryWithBackoff(
        () => axios.post<DrivewayResponse>('/api/driveways', drivewayData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000 // 15 second timeout for driveway creation
        }),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            // Retry on network errors, timeouts, and 5xx server errors
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Driveway Created',
        message: 'Your driveway has been added successfully!',
        context: 'system'
      });

      return response.data;
    } catch (error: any) {
      console.error('Driveway creation failed:', error);
      
      let errorMessage = 'Failed to create driveway';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Driveway Creation Failed',
        message: errorMessage,
        context: 'system',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Update driveway with retry logic and comprehensive error handling
   */
  async updateDriveway(id: string, request: DrivewayRequest): Promise<DrivewayResponse> {
    // Validate request first
    const validation = this.validateDrivewayRequest(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        notificationService.showNotification({
          type: 'warning',
          title: 'Driveway Warning',
          message: warning,
          context: 'system',
          duration: 5000
        });
      });
    }

    const drivewayData = {
      ...request,
      isAvailable: request.isAvailable ?? true
    };

    try {
      const response = await retryWithBackoff(
        () => axios.put<DrivewayResponse>(`/api/driveways/${id}`, drivewayData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000 // 15 second timeout for driveway update
        }),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            // Retry on network errors, timeouts, and 5xx server errors
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Driveway Updated',
        message: 'Your driveway has been updated successfully!',
        context: 'system'
      });

      return response.data;
    } catch (error: any) {
      console.error('Driveway update failed:', error);
      
      let errorMessage = 'Failed to update driveway';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Driveway Update Failed',
        message: errorMessage,
        context: 'system',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Delete driveway with retry logic and comprehensive error handling
   */
  async deleteDriveway(id: string): Promise<void> {
    try {
      await retryWithBackoff(
        () => axios.delete(`/api/driveways/${id}`, {
          timeout: 10000 // 10 second timeout for deletion
        }),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            // Retry on network errors, timeouts, and 5xx server errors
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Driveway Deleted',
        message: 'Your driveway has been deleted successfully.',
        context: 'system'
      });
    } catch (error: any) {
      console.error('Driveway deletion failed:', error);
      
      let errorMessage = 'Failed to delete driveway';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Driveway Deletion Failed',
        message: errorMessage,
        context: 'system',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Toggle driveway availability with retry logic
   */
  async toggleAvailability(id: string, isAvailable: boolean): Promise<void> {
    try {
      await retryWithBackoff(
        () => axios.put(`/api/driveways/${id}/availability`, 
          { isAvailable }, 
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000
          }
        ),
        {
          maxAttempts: this.MAX_RETRIES,
          baseDelay: this.RETRY_DELAY,
          retryCondition: (error) => {
            return (
              !error.response || 
              error.code === 'NETWORK_ERROR' ||
              error.code === 'ECONNABORTED' ||
              (error.response.status >= 500 && error.response.status < 600)
            );
          }
        }
      );

      notificationService.showNotification({
        type: 'success',
        title: 'Availability Updated',
        message: `Driveway is now ${isAvailable ? 'available' : 'unavailable'} for bookings.`,
        context: 'system'
      });
    } catch (error: any) {
      console.error('Availability toggle failed:', error);
      
      let errorMessage = 'Failed to update availability';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notificationService.showNotification({
        type: 'error',
        title: 'Availability Update Failed',
        message: errorMessage,
        context: 'system',
        priority: 'high'
      });

      throw error;
    }
  }
}

export const robustDrivewayService = new RobustDrivewayService();
