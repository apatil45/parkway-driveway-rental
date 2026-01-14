/**
 * MapService - Singleton service for managing Leaflet map instances
 * 
 * This service manages all map lifecycle outside of React's component lifecycle,
 * preventing race conditions and ensuring reliable cleanup.
 * 
 * IMPORTANT: This service only manages properties and references.
 * React handles DOM removal - we never call removeChild or manipulate DOM structure.
 */

type LeafletMap = any; // Leaflet map instance type

interface MapInstance {
  map: LeafletMap;
  container: HTMLElement;
  containerId: string;
}

class MapService {
  private static instance: MapService;
  private mapInstances: Map<string, MapInstance> = new Map();
  private containerRegistry: Map<string, HTMLElement> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Check if a container is safe to use (no Leaflet artifacts)
   */
  isContainerSafe(container: HTMLElement | null): boolean {
    const logPrefix = '[MapService.isContainerSafe]';
    console.log(`${logPrefix} Checking container:`, container ? 'exists' : 'null');
    
    if (!container) {
      console.log(`${logPrefix} Container is null - NOT SAFE`);
      return false;
    }
    
    // Check for Leaflet tracking properties on the container itself
    const hasLeafletId = !!(container as any)._leaflet_id;
    const hasLeaflet = !!(container as any)._leaflet;
    console.log(`${logPrefix} Container props - _leaflet_id: ${hasLeafletId}, _leaflet: ${hasLeaflet}`);
    
    if (hasLeafletId) {
      console.warn(`${logPrefix} Container has _leaflet_id: ${(container as any)._leaflet_id} - NOT SAFE`);
      return false;
    }
    if (hasLeaflet) {
      console.warn(`${logPrefix} Container has _leaflet - NOT SAFE`);
      return false;
    }
    
    // Check for Leaflet DOM elements inside the container
    try {
      const leafletContainer = container.querySelector('.leaflet-container');
      if (leafletContainer) {
        console.log(`${logPrefix} Found .leaflet-container element`);
        // If there's a leaflet container, check if it has tracking properties
        const leafletEl = leafletContainer as HTMLElement;
        const leafletElId = (leafletEl as any)._leaflet_id;
        const leafletElMap = !!(leafletEl as any)._leaflet;
        console.log(`${logPrefix} Leaflet container props - _leaflet_id: ${leafletElId}, _leaflet: ${leafletElMap}`);
        
        if (leafletElId || leafletElMap) {
          console.warn(`${logPrefix} Leaflet container has tracking props - NOT SAFE`);
          return false;
        }
        // If leaflet container exists but has no tracking, it might be leftover DOM
        // from a previous instance - not safe
        console.warn(`${logPrefix} Leaflet container exists without tracking - NOT SAFE (leftover DOM)`);
        return false;
      } else {
        console.log(`${logPrefix} No .leaflet-container found`);
      }
    } catch (e) {
      console.error(`${logPrefix} querySelector error:`, e);
      // querySelector failed - container might be detached
      // But we'll allow it if it's just a querySelector error (not a real issue)
      // Only fail if container is definitely detached
      if (!container.parentNode && !container.isConnected) {
        console.warn(`${logPrefix} Container is detached - NOT SAFE`);
        return false;
      }
    }
    
    // Container is safe - no Leaflet artifacts
    console.log(`${logPrefix} Container is SAFE ✓`);
    return true;
  }

  /**
   * Clean a container, removing all Leaflet artifacts
   * AGGRESSIVE CLEANUP: Ensures container is completely clean for reuse
   */
  cleanContainer(container: HTMLElement | null): void {
    const logPrefix = '[MapService.cleanContainer]';
    console.log(`${logPrefix} Starting cleanup for container:`, container ? 'exists' : 'null');
    
    if (!container) {
      console.log(`${logPrefix} Container is null - skipping cleanup`);
      return;
    }

    // Step 1: Clear Leaflet tracking properties from container itself
    try {
      const hadLeafletId = !!(container as any)._leaflet_id;
      const hadLeaflet = !!(container as any)._leaflet;
      console.log(`${logPrefix} Step 1 - Clearing container props (had _leaflet_id: ${hadLeafletId}, _leaflet: ${hadLeaflet})`);
      delete (container as any)._leaflet_id;
      delete (container as any)._leaflet;
      console.log(`${logPrefix} Step 1 - Container props cleared`);
    } catch (e) {
      console.error(`${logPrefix} Step 1 - Error clearing props:`, e);
    }

    // Step 2: ALWAYS clear innerHTML to remove any leftover Leaflet elements
    // This is the most reliable way to ensure a clean container
    try {
      const isInDOM = !!(container.parentNode || container.isConnected);
      console.log(`${logPrefix} Step 2 - Container in DOM: ${isInDOM}`);
      
      if (isInDOM) {
        const beforeHTML = container.innerHTML.substring(0, 100);
        const hasLeafletBefore = !!container.querySelector('.leaflet-container');
        console.log(`${logPrefix} Step 2 - Before clear - has .leaflet-container: ${hasLeafletBefore}, innerHTML length: ${container.innerHTML.length}`);
        
        // Clear all children - this removes any .leaflet-container divs
        container.innerHTML = '';
        
        const afterHTML = container.innerHTML;
        const hasLeafletAfter = !!container.querySelector('.leaflet-container');
        console.log(`${logPrefix} Step 2 - After clear - has .leaflet-container: ${hasLeafletAfter}, innerHTML length: ${afterHTML.length}`);
      } else {
        console.log(`${logPrefix} Step 2 - Container not in DOM, skipping innerHTML clear`);
      }
    } catch (e) {
      console.error(`${logPrefix} Step 2 - Error clearing innerHTML:`, e);
      // Container might be removed during cleanup - ignore
    }

    // Step 3: Double-check and clear properties from any remaining Leaflet containers
    // This handles edge cases where innerHTML clearing didn't work
    try {
      const leafletContainers = container.querySelectorAll?.('.leaflet-container');
      const leafletCount = leafletContainers ? leafletContainers.length : 0;
      console.log(`${logPrefix} Step 3 - Found ${leafletCount} leaflet containers after innerHTML clear`);
      
      if (leafletContainers && leafletContainers.length > 0) {
        console.warn(`${logPrefix} Step 3 - WARNING: Leaflet containers still exist after innerHTML clear!`);
        // If there are still leaflet containers after innerHTML clear, clear properties
        // Don't use removeChild - just clear properties and let innerHTML handle removal
        leafletContainers.forEach((el, idx) => {
          try {
            const leafletEl = el as HTMLElement;
            const hadId = !!(leafletEl as any)._leaflet_id;
            const hadMap = !!(leafletEl as any)._leaflet;
            console.log(`${logPrefix} Step 3 - Clearing props from container ${idx} (had _leaflet_id: ${hadId}, _leaflet: ${hadMap})`);
            // Clear properties only - don't manipulate DOM structure
            delete (leafletEl as any)._leaflet_id;
            delete (leafletEl as any)._leaflet;
          } catch (e) {
            console.error(`${logPrefix} Step 3 - Error clearing props from container ${idx}:`, e);
          }
        });
        // Clear innerHTML again to remove any remaining elements
        if (container.parentNode || container.isConnected) {
          console.log(`${logPrefix} Step 3 - Clearing innerHTML again`);
          container.innerHTML = '';
        }
      }
    } catch (e) {
      console.error(`${logPrefix} Step 3 - Error:`, e);
      // querySelector failed - container might be detached, but that's okay
    }

    // Step 4: Final verification - clear innerHTML one more time if needed
    // This ensures we have a completely clean container
    try {
      if (container.parentNode || container.isConnected) {
        const stillHasLeaflet = container.querySelector('.leaflet-container');
        console.log(`${logPrefix} Step 4 - Final check - still has .leaflet-container: ${!!stillHasLeaflet}`);
        if (stillHasLeaflet) {
          console.warn(`${logPrefix} Step 4 - WARNING: Still has leaflet container, force clearing again`);
          // Force clear one more time
          container.innerHTML = '';
        }
      }
    } catch (e) {
      console.error(`${logPrefix} Step 4 - Error:`, e);
    }
    
    console.log(`${logPrefix} Cleanup complete`);
  }

  /**
   * Get or create a map instance for a container
   * Returns null if container is not safe to use
   */
  getMap(containerId: string, container: HTMLElement): LeafletMap | null {
    // Check if container is safe
    if (!this.isContainerSafe(container)) {
      // Clean it first
      this.cleanContainer(container);
      
      // Verify it's clean now
      if (!this.isContainerSafe(container)) {
        return null;
      }
    }

    // Check if we already have a map for this container
    if (this.mapInstances.has(containerId)) {
      const instance = this.mapInstances.get(containerId)!;
      
      // Verify it's the same container
      if (instance.container === container) {
        return instance.map;
      }
      
      // Container changed - destroy old map
      this.destroyMap(containerId);
    }

    // Register container (but don't create map yet - that's done by MapContainer)
    this.containerRegistry.set(containerId, container);
    
    return null; // Map will be created by MapContainer, we just track it
  }

  /**
   * Register a map instance (called after MapContainer creates it)
   */
  registerMap(containerId: string, map: LeafletMap, container: HTMLElement): void {
    const logPrefix = '[MapService.registerMap]';
    console.log(`${logPrefix} Registering map for containerId: ${containerId}`);
    
    // Check if we already have a map for this containerId
    if (this.mapInstances.has(containerId)) {
      const existing = this.mapInstances.get(containerId)!;
      console.log(`${logPrefix} Existing instance found`);
      // If it's the same map instance, don't register again
      if (existing.map === map && existing.container === container) {
        console.log(`${logPrefix} Same map/container - skipping registration`);
        return;
      }
      // Different map/container - destroy old one first
      console.log(`${logPrefix} Different map/container - destroying old instance`);
      this.destroyMap(containerId);
    }
    
    this.mapInstances.set(containerId, { map, container, containerId });
    this.containerRegistry.set(containerId, container);
    console.log(`${logPrefix} Map registered successfully`);
  }

  /**
   * Destroy a map instance and clean up
   * PASSIVE: Only clears properties and references, NEVER calls map.remove()
   * React handles DOM removal - we just clear Leaflet tracking properties
   */
  destroyMap(containerId: string): void {
    const logPrefix = '[MapService.destroyMap]';
    console.log(`${logPrefix} Destroying map for containerId: ${containerId}`);
    
    const instance = this.mapInstances.get(containerId);
    
    if (instance) {
      console.log(`${logPrefix} Found instance, starting cleanup`);
      try {
        const { map, container } = instance;
        
        // NEVER call map.remove() - it causes removeChild errors when React is unmounting
        // Instead, just clear Leaflet tracking properties
        if (map && map._container) {
          try {
            const hadId = !!(map._container as any)._leaflet_id;
            const hadMap = !!(map._container as any)._leaflet;
            console.log(`${logPrefix} Map container props - _leaflet_id: ${hadId}, _leaflet: ${hadMap}`);
            
            // Clear Leaflet tracking properties from the map's container
            delete (map._container as any)._leaflet_id;
            delete (map._container as any)._leaflet;
            console.log(`${logPrefix} Map container props cleared`);
          } catch (e) {
            console.error(`${logPrefix} Error clearing map container props:`, e);
            // Ignore - container might already be removed
          }
        } else {
          console.log(`${logPrefix} No map or map._container to clean`);
        }
        
        // Clean container properties (passive - no DOM manipulation)
        if (container) {
          console.log(`${logPrefix} Cleaning container`);
          this.cleanContainer(container);
        } else {
          console.log(`${logPrefix} No container to clean`);
        }
      } catch (e) {
        console.error(`${logPrefix} Error during cleanup:`, e);
        // Ignore errors during cleanup
      }
      
      // Remove from registry
      this.mapInstances.delete(containerId);
      this.containerRegistry.delete(containerId);
      console.log(`${logPrefix} Removed from registry`);
    } else {
      console.log(`${logPrefix} No instance found for containerId: ${containerId}`);
    }
    
    console.log(`${logPrefix} Destroy complete`);
  }

  /**
   * Get all active map instances (for debugging)
   */
  getActiveMaps(): string[] {
    return Array.from(this.mapInstances.keys());
  }

  /**
   * Destroy all maps (for cleanup on page unload)
   */
  destroyAll(): void {
    const containerIds = Array.from(this.mapInstances.keys());
    containerIds.forEach(id => this.destroyMap(id));
  }
}

// Export singleton instance
export const mapService = MapService.getInstance();
export default mapService;
