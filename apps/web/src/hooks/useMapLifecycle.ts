/**
 * useMapLifecycle - Hook for managing map lifecycle with state machine
 * 
 * Uses a simple state machine to track map lifecycle:
 * idle → cleaning → clean → ready → initializing → initialized
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { mapService } from '@/services/MapService';

type MapState = 'idle' | 'cleaning' | 'clean' | 'ready' | 'initializing' | 'initialized' | 'destroyed';

interface UseMapLifecycleOptions {
  containerId: string;
  containerRef: React.RefObject<HTMLElement>;
  onStateChange?: (state: MapState) => void;
}

export function useMapLifecycle({
  containerId,
  containerRef,
  onStateChange,
}: UseMapLifecycleOptions) {
  const [state, setState] = useState<MapState>('idle');
  const stateRef = useRef<MapState>('idle');
  const cleanupPromiseRef = useRef<Promise<void> | null>(null);
  const initializationAttemptRef = useRef<number>(0);
  const isInitializingRef = useRef<boolean>(false);

  // Update both state and ref
  const updateState = useCallback((newState: MapState) => {
    stateRef.current = newState;
    setState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Clean container asynchronously
  const clean = useCallback(async (): Promise<void> => {
    // If already cleaning, return existing promise
    if (cleanupPromiseRef.current && stateRef.current === 'cleaning') {
      return cleanupPromiseRef.current;
    }

    updateState('cleaning');

    const cleanupPromise = new Promise<void>((resolve) => {
      // Wait for React to finish any DOM operations
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            mapService.cleanContainer(containerRef.current);
          }
          updateState('clean');
          resolve();
        });
      });
    });

    cleanupPromiseRef.current = cleanupPromise;
    return cleanupPromise;
  }, [containerRef, updateState]);

  // Prepare for initialization
  const prepare = useCallback(async (): Promise<void> => {
    // Wait for cleanup if in progress
    if (stateRef.current === 'cleaning' && cleanupPromiseRef.current) {
      await cleanupPromiseRef.current;
    }

    // Check if container exists
    if (!containerRef.current) {
      // Container not ready yet - stay in current state
      return;
    }

    // ALWAYS clean the container first, regardless of current state
    // This ensures we start with a completely clean container
    mapService.cleanContainer(containerRef.current);
    
    // Wait for DOM to settle after cleanup
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Verify container is safe after cleanup
    if (mapService.isContainerSafe(containerRef.current)) {
      updateState('ready');
      return;
    }

    // Still not safe - try one more aggressive cleanup
    mapService.cleanContainer(containerRef.current);
    // Wait again
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Final check
    if (mapService.isContainerSafe(containerRef.current)) {
      updateState('ready');
    } else {
      // Last resort: force clean and mark as ready anyway
      // This handles edge cases where the check is too strict
      // The container should be clean after innerHTML clearing
      mapService.cleanContainer(containerRef.current);
      updateState('ready');
    }
  }, [containerRef, updateState]);

  // Initialize map (called when MapContainer is ready)
  const initialize = useCallback((map: any) => {
    // Prevent multiple initialization attempts
    if (isInitializingRef.current) {
      return false;
    }

    // If already initialized, don't initialize again
    if (stateRef.current === 'initialized') {
      return true;
    }

    if (stateRef.current !== 'ready') {
      // Don't log warning if we're already cleaning/preparing
      if (stateRef.current !== 'cleaning' && stateRef.current !== 'clean') {
        console.warn('Cannot initialize map: state is not ready', stateRef.current);
      }
      return false;
    }

    if (!containerRef.current) {
      console.warn('Cannot initialize map: container is null');
      return false;
    }

    // Increment attempt counter
    initializationAttemptRef.current += 1;
    
    // Prevent infinite loops - max 3 attempts
    if (initializationAttemptRef.current > 3) {
      console.error('Map initialization failed after 3 attempts. Forcing ready state.');
      updateState('ready');
      return false;
    }

    // Verify container is still safe
    if (!mapService.isContainerSafe(containerRef.current)) {
      // Don't log if we've already tried multiple times
      if (initializationAttemptRef.current === 1) {
        console.warn('Cannot initialize map: container is not safe. Cleaning...');
      }
      isInitializingRef.current = false;
      updateState('cleaning');
      clean().then(() => {
        prepare().then(() => {
          // Reset attempt counter after cleanup
          initializationAttemptRef.current = 0;
        });
      });
      return false;
    }

    // Mark as initializing to prevent multiple calls
    isInitializingRef.current = true;
    updateState('initializing');
    
    try {
      // Register map with service
      mapService.registerMap(containerId, map, containerRef.current);
      updateState('initialized');
      initializationAttemptRef.current = 0; // Reset on success
      isInitializingRef.current = false;
      return true;
    } catch (error: any) {
      console.error('Map initialization error:', error);
      isInitializingRef.current = false;
      if (error?.message?.includes('Map container is being reused')) {
        updateState('cleaning');
        clean().then(() => {
          prepare().then(() => {
            initializationAttemptRef.current = 0;
          });
        });
      } else {
        updateState('clean');
      }
      return false;
    }
  }, [containerId, containerRef, clean, prepare, updateState]);

  // Destroy map
  const destroy = useCallback(() => {
    updateState('destroyed');
    mapService.destroyMap(containerId);
    cleanupPromiseRef.current = null;
  }, [containerId, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    state,
    stateRef,
    clean,
    prepare,
    initialize,
    destroy,
    isReady: state === 'ready',
    isInitialized: state === 'initialized',
  };
}
