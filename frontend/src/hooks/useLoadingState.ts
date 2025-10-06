// Enhanced Loading State Hook for Parkway.com
import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  message: string;
  startTime: number | null;
  estimatedDuration: number | null;
}

export interface LoadingOptions {
  initialMessage?: string;
  estimatedDuration?: number;
  showProgress?: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export interface LoadingActions {
  start: (message?: string) => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  complete: (message?: string) => void;
  error: (error: string) => void;
  reset: () => void;
}

const useLoadingState = (options: LoadingOptions = {}): [LoadingState, LoadingActions] => {
  const {
    initialMessage = 'Loading...',
    estimatedDuration = null,
    showProgress = false,
    onComplete,
    onError
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: 0,
    message: initialMessage,
    startTime: null,
    estimatedDuration
  });

  const progressIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Auto-progress for operations with estimated duration
  useEffect(() => {
    if (state.isLoading && state.estimatedDuration && showProgress) {
      const interval = 100; // Update every 100ms
      const totalSteps = state.estimatedDuration / interval;
      let currentStep = 0;

      progressIntervalRef.current = window.setInterval(() => {
        currentStep++;
        const progress = Math.min((currentStep / totalSteps) * 100, 95); // Cap at 95%
        
        setState(prev => ({
          ...prev,
          progress
        }));

        if (currentStep >= totalSteps) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
      }, interval);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    }
  }, [state.isLoading, state.estimatedDuration, showProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const start = useCallback((message?: string) => {
    setState({
      isLoading: true,
      error: null,
      progress: 0,
      message: message || initialMessage,
      startTime: Date.now(),
      estimatedDuration
    });

    // Clear any existing intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [initialMessage, estimatedDuration]);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress))
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const complete = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      message: message || 'Complete!',
      error: null
    }));

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Call completion callback
    if (onComplete) {
      timeoutRef.current = window.setTimeout(() => {
        onComplete();
      }, 500); // Small delay to show completion state
    }

    // Reset after showing completion
    timeoutRef.current = window.setTimeout(() => {
      setState(prev => ({
        ...prev,
        progress: 0,
        message: initialMessage,
        startTime: null
      }));
    }, 1500);
  }, [onComplete, initialMessage]);

  const error = useCallback((errorMessage: string) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: errorMessage,
      progress: 0
    }));

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Call error callback
    if (onError) {
      onError(errorMessage);
    }

    // Auto-reset after error
    timeoutRef.current = window.setTimeout(() => {
      setState(prev => ({
        ...prev,
        error: null,
        message: initialMessage,
        startTime: null
      }));
    }, 3000);
  }, [onError, initialMessage]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      progress: 0,
      message: initialMessage,
      startTime: null,
      estimatedDuration
    });

    // Clear intervals and timeouts
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [initialMessage, estimatedDuration]);

  const actions: LoadingActions = {
    start,
    setProgress,
    setMessage,
    complete,
    error,
    reset
  };

  return [state, actions];
};

export default useLoadingState;
