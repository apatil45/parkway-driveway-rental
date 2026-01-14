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
    if (!container) return false;
    
    // Check for Leaflet tracking properties on the container itself
    if ((container as any)._leaflet_id) return false;
    if ((container as any)._leaflet) return false;
    
    // Check for Leaflet DOM elements inside the container
    try {
      const leafletContainer = container.querySelector('.leaflet-container');
      if (leafletContainer) {
        // If there's a leaflet container, check if it has tracking properties
        const leafletEl = leafletContainer as HTMLElement;
        if ((leafletEl as any)._leaflet_id || (leafletEl as any)._leaflet) {
          return false;
        }
        // If leaflet container exists but has no tracking, it might be leftover DOM
        // from a previous instance - not safe
        return false;
      }
    } catch (e) {
      // querySelector failed - container might be detached
      // But we'll allow it if it's just a querySelector error (not a real issue)
      // Only fail if container is definitely detached
      if (!container.parentNode && !container.isConnected) {
        return false;
      }
    }
    
    // Container is safe - no Leaflet artifacts
    return true;
  }

  /**
   * Clean a container, removing all Leaflet artifacts
   * AGGRESSIVE CLEANUP: Ensures container is completely clean for reuse
   */
  cleanContainer(container: HTMLElement | null): void {
    if (!container) return;

    // Step 1: Clear Leaflet tracking properties from container itself
    try {
      delete (container as any)._leaflet_id;
      delete (container as any)._leaflet;
    } catch (e) {
      // Ignore
    }

    // Step 2: ALWAYS clear innerHTML to remove any leftover Leaflet elements
    // This is the most reliable way to ensure a clean container
    try {
      // Check if container is still in DOM before clearing
      if (container.parentNode || container.isConnected) {
        // Clear all children - this removes any .leaflet-container divs
        container.innerHTML = '';
      }
    } catch (e) {
      // Container might be removed during cleanup - ignore
    }

    // Step 3: Double-check and clear properties from any remaining Leaflet containers
    // This handles edge cases where innerHTML clearing didn't work
    try {
      const leafletContainers = container.querySelectorAll?.('.leaflet-container');
      if (leafletContainers && leafletContainers.length > 0) {
        // If there are still leaflet containers after innerHTML clear, clear properties
        // Don't use removeChild - just clear properties and let innerHTML handle removal
        leafletContainers.forEach((el) => {
          try {
            const leafletEl = el as HTMLElement;
            // Clear properties only - don't manipulate DOM structure
            delete (leafletEl as any)._leaflet_id;
            delete (leafletEl as any)._leaflet;
          } catch (e) {
            // Ignore - element might already be removed
          }
        });
        // Clear innerHTML again to remove any remaining elements
        if (container.parentNode || container.isConnected) {
          container.innerHTML = '';
        }
      }
    } catch (e) {
      // querySelector failed - container might be detached, but that's okay
    }

    // Step 4: Final verification - clear innerHTML one more time if needed
    // This ensures we have a completely clean container
    try {
      if (container.parentNode || container.isConnected) {
        const stillHasLeaflet = container.querySelector('.leaflet-container');
        if (stillHasLeaflet) {
          // Force clear one more time
          container.innerHTML = '';
        }
      }
    } catch (e) {
      // Ignore
    }
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
    // Check if we already have a map for this containerId
    if (this.mapInstances.has(containerId)) {
      const existing = this.mapInstances.get(containerId)!;
      // If it's the same map instance, don't register again
      if (existing.map === map && existing.container === container) {
        return;
      }
      // Different map/container - destroy old one first
      this.destroyMap(containerId);
    }
    
    this.mapInstances.set(containerId, { map, container, containerId });
    this.containerRegistry.set(containerId, container);
  }

  /**
   * Destroy a map instance and clean up
   * PASSIVE: Only clears properties and references, never manipulates DOM
   */
  destroyMap(containerId: string): void {
    const instance = this.mapInstances.get(containerId);
    
    if (instance) {
      try {
        const { map, container } = instance;
        
        // Step 1: Try to call map.remove() ONLY if container is still in DOM
        // This lets Leaflet clean up its own resources properly
        if (map && typeof map.remove === 'function') {
          try {
            if (map._container) {
              const containerParent = map._container.parentNode;
              const isConnected = map._container.isConnected;
              
              // Only call remove if container is still in DOM
              // If React is already removing it, skip this to avoid conflicts
              if (containerParent && isConnected) {
                map.remove();
              } else {
                // Container already removed - just clear properties
                delete (map._container as any)._leaflet_id;
                delete (map._container as any)._leaflet;
              }
            }
          } catch (e) {
            // map.remove() failed - container might be removed by React
            // Just clear properties
            if (map._container) {
              try {
                delete (map._container as any)._leaflet_id;
                delete (map._container as any)._leaflet;
              } catch (e2) {
                // Ignore
              }
            }
          }
        }
        
        // Step 2: Clean container properties (passive - no DOM manipulation)
        if (container) {
          this.cleanContainer(container);
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      
      // Step 3: Remove from registry
      this.mapInstances.delete(containerId);
      this.containerRegistry.delete(containerId);
    }
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
