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
    const logPrefix = `[useMapLifecycle.clean] containerId: ${containerId}`;
    console.log(`${logPrefix} Starting clean, current state: ${stateRef.current}`);
    
    // If already cleaning, return existing promise
    if (cleanupPromiseRef.current && stateRef.current === 'cleaning') {
      console.log(`${logPrefix} Already cleaning, returning existing promise`);
      return cleanupPromiseRef.current;
    }

    console.log(`${logPrefix} Updating state to 'cleaning'`);
    updateState('cleaning');

    const cleanupPromise = new Promise<void>((resolve) => {
      // Wait for React to finish any DOM operations
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log(`${logPrefix} Running cleanup after requestAnimationFrame x2`);
          if (containerRef.current) {
            console.log(`${logPrefix} Container exists, calling cleanContainer`);
            mapService.cleanContainer(containerRef.current);
          } else {
            console.warn(`${logPrefix} Container is null!`);
          }
          console.log(`${logPrefix} Updating state to 'clean'`);
          updateState('clean');
          resolve();
        });
      });
    });

    cleanupPromiseRef.current = cleanupPromise;
    return cleanupPromise;
  }, [containerId, containerRef, updateState]);

  // Prepare for initialization
  const prepare = useCallback(async (): Promise<void> => {
    const logPrefix = `[useMapLifecycle.prepare] containerId: ${containerId}`;
    console.log(`${logPrefix} Starting prepare, current state: ${stateRef.current}`);
    
    // Wait for cleanup if in progress
    if (stateRef.current === 'cleaning' && cleanupPromiseRef.current) {
      console.log(`${logPrefix} Waiting for cleanup to complete...`);
      await cleanupPromiseRef.current;
      console.log(`${logPrefix} Cleanup complete, continuing`);
    }

    // Check if container exists
    if (!containerRef.current) {
      console.warn(`${logPrefix} Container is null - cannot prepare`);
      // Container not ready yet - stay in current state
      return;
    }

    console.log(`${logPrefix} Container exists, cleaning...`);
    // ALWAYS clean the container first, regardless of current state
    // This ensures we start with a completely clean container
    mapService.cleanContainer(containerRef.current);
    
    console.log(`${logPrefix} Waiting for DOM to settle...`);
    // Wait for DOM to settle after cleanup
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    console.log(`${logPrefix} Checking if container is safe...`);
    // Verify container is safe after cleanup
    const isSafe = mapService.isContainerSafe(containerRef.current);
    console.log(`${logPrefix} Container safe check result: ${isSafe}`);
    
    if (isSafe) {
      console.log(`${logPrefix} Container is safe, updating state to 'ready'`);
      updateState('ready');
      return;
    }

    console.warn(`${logPrefix} Container not safe after first cleanup, trying again...`);
    // Still not safe - try one more aggressive cleanup
    mapService.cleanContainer(containerRef.current);
    // Wait again
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    console.log(`${logPrefix} Final safety check...`);
    const isSafeAfterRetry = mapService.isContainerSafe(containerRef.current);
    console.log(`${logPrefix} Final safety check result: ${isSafeAfterRetry}`);
    
    // Final check
    if (isSafeAfterRetry) {
      console.log(`${logPrefix} Container is safe after retry, updating state to 'ready'`);
      updateState('ready');
    } else {
      console.warn(`${logPrefix} Container still not safe, forcing ready state`);
      // Last resort: force clean and mark as ready anyway
      // This handles edge cases where the check is too strict
      // The container should be clean after innerHTML clearing
      mapService.cleanContainer(containerRef.current);
      updateState('ready');
    }
  }, [containerId, containerRef, updateState]);

  // Initialize map (called when MapContainer is ready)
  const initialize = useCallback((map: any) => {
    const logPrefix = `[useMapLifecycle.initialize] containerId: ${containerId}`;
    console.log(`${logPrefix} Initialize called, current state: ${stateRef.current}, isInitializing: ${isInitializingRef.current}`);
    
    // Prevent multiple initialization attempts
    if (isInitializingRef.current) {
      console.warn(`${logPrefix} Already initializing, skipping`);
      return false;
    }

    // If already initialized, don't initialize again
    if (stateRef.current === 'initialized') {
      console.log(`${logPrefix} Already initialized, returning true`);
      return true;
    }

    if (stateRef.current !== 'ready') {
      // Don't log warning if we're already cleaning/preparing
      if (stateRef.current !== 'cleaning' && stateRef.current !== 'clean') {
        console.warn(`${logPrefix} State is not ready: ${stateRef.current}`);
      }
      return false;
    }

    if (!containerRef.current) {
      console.warn(`${logPrefix} Container is null`);
      return false;
    }

    // Increment attempt counter
    initializationAttemptRef.current += 1;
    console.log(`${logPrefix} Initialization attempt #${initializationAttemptRef.current}`);
    
    // Prevent infinite loops - max 3 attempts
    if (initializationAttemptRef.current > 3) {
      console.error(`${logPrefix} Failed after 3 attempts. Forcing ready state.`);
      updateState('ready');
      return false;
    }

    // Verify container is still safe
    const isSafe = mapService.isContainerSafe(containerRef.current);
    console.log(`${logPrefix} Container safety check: ${isSafe}`);
    
    if (!isSafe) {
      // Don't log if we've already tried multiple times
      if (initializationAttemptRef.current === 1) {
        console.warn(`${logPrefix} Container is not safe. Cleaning...`);
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
    console.log(`${logPrefix} Container is safe, marking as initializing`);
    isInitializingRef.current = true;
    updateState('initializing');
    
    try {
      // Register map with service
      console.log(`${logPrefix} Registering map with service...`);
      mapService.registerMap(containerId, map, containerRef.current);
      console.log(`${logPrefix} Map registered successfully, updating state to 'initialized'`);
      updateState('initialized');
      initializationAttemptRef.current = 0; // Reset on success
      isInitializingRef.current = false;
      return true;
    } catch (error: any) {
      console.error(`${logPrefix} Map initialization error:`, error);
      isInitializingRef.current = false;
      if (error?.message?.includes('Map container is being reused')) {
        console.warn(`${logPrefix} Map container reuse error, cleaning...`);
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
    const logPrefix = `[useMapLifecycle.destroy] containerId: ${containerId}`;
    console.log(`${logPrefix} Destroying map, current state: ${stateRef.current}`);
    updateState('destroyed');
    mapService.destroyMap(containerId);
    cleanupPromiseRef.current = null;
    console.log(`${logPrefix} Destroy complete`);
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
