'use client';

import { useState } from 'react';
import { Button, Card } from './';
import { useToast } from './Toast';
import api from '@/lib/api-client';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface ReviewFormProps {
  drivewayId: string;
  bookingId?: string;
  onSuccess?: () => void;
  existingReview?: {
    id: string;
    rating: number;
    comment?: string;
  };
}

export default function ReviewForm({ drivewayId, bookingId, onSuccess, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reviews', {
        drivewayId,
        rating,
        comment: comment.trim() || undefined
      });
      
      showToast(existingReview ? 'Review updated successfully!' : 'Thank you for your review!', 'success');
      if (onSuccess) {
        onSuccess?.();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to submit review';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoveredRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  {isFilled ? (
                    <StarIcon className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <StarOutlineIcon className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              );
            })}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">{rating} star{rating !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comment (Optional)
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Share your experience..."
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">{comment.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            loading={loading}
            disabled={rating === 0}
          >
            {existingReview ? 'Update Review' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

