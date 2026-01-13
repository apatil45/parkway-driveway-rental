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

    // Verify container is safe
    if (containerRef.current && mapService.isContainerSafe(containerRef.current)) {
      updateState('ready');
      return;
    }

    // Not safe, clean it
    await clean();
    
    // Wait a bit for DOM to settle after cleanup
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Verify again after cleanup
    if (containerRef.current && mapService.isContainerSafe(containerRef.current)) {
      updateState('ready');
    } else {
      // Still not safe - try one more aggressive cleanup
      if (containerRef.current) {
        mapService.cleanContainer(containerRef.current);
        // Wait again
        await new Promise(resolve => requestAnimationFrame(resolve));
        if (containerRef.current && mapService.isContainerSafe(containerRef.current)) {
          updateState('ready');
        } else {
          // Last resort: mark as clean anyway and let initialization handle it
          updateState('clean');
        }
      }
    }
  }, [containerRef, clean, updateState]);

  // Initialize map (called when MapContainer is ready)
  const initialize = useCallback((map: any) => {
    if (stateRef.current !== 'ready') {
      console.warn('Cannot initialize map: state is not ready', stateRef.current);
      return false;
    }

    if (!containerRef.current) {
      console.warn('Cannot initialize map: container is null');
      return false;
    }

    // Verify container is still safe
    if (!mapService.isContainerSafe(containerRef.current)) {
      console.warn('Cannot initialize map: container is not safe');
      updateState('cleaning');
      clean().then(() => prepare());
      return false;
    }

    updateState('initializing');
    
    try {
      // Register map with service
      mapService.registerMap(containerId, map, containerRef.current);
      updateState('initialized');
      return true;
    } catch (error: any) {
      console.error('Map initialization error:', error);
      if (error?.message?.includes('Map container is being reused')) {
        updateState('cleaning');
        clean().then(() => prepare());
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
