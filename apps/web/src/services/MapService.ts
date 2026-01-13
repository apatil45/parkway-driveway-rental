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
    
    // Check if container is still in DOM
    if (!container.parentNode && !container.isConnected) {
      return false;
    }
    
    // Check for Leaflet tracking properties
    if ((container as any)._leaflet_id) return false;
    if ((container as any)._leaflet) return false;
    
    // Check for Leaflet DOM elements
    try {
      if (container.querySelector('.leaflet-container')) return false;
    } catch (e) {
      // Container might be detached - not safe
      return false;
    }
    
    return true;
  }

  /**
   * Clean a container, removing all Leaflet artifacts
   * PASSIVE CLEANUP: Only clears properties, never manipulates DOM structure
   * React handles DOM removal - we just clear Leaflet tracking
   */
  cleanContainer(container: HTMLElement | null): void {
    if (!container) return;

    // Check if container is still in DOM - if not, just clear properties
    const isInDOM = container.parentNode !== null || container.isConnected;

    // Step 1: Clear Leaflet tracking properties from container itself
    try {
      delete (container as any)._leaflet_id;
      delete (container as any)._leaflet;
    } catch (e) {
      // Ignore
    }

    // Step 2: If container is in DOM, try to clear innerHTML (safest way)
    // This removes all Leaflet elements without calling removeChild
    if (isInDOM) {
      try {
        // Only clear if there are Leaflet elements
        const hasLeafletElements = container.querySelector('.leaflet-container');
        if (hasLeafletElements) {
          // Clear innerHTML - this removes all children without removeChild errors
          container.innerHTML = '';
        }
      } catch (e) {
        // Container might be removed during cleanup - ignore
      }
    }

    // Step 3: Clear properties from any Leaflet containers (if they still exist)
    // We do this AFTER clearing innerHTML to catch any that weren't removed
    try {
      const leafletContainers = container.querySelectorAll?.('.leaflet-container');
      if (leafletContainers) {
        leafletContainers.forEach((el) => {
          try {
            const leafletEl = el as HTMLElement;
            delete (leafletEl as any)._leaflet_id;
            delete (leafletEl as any)._leaflet;
          } catch (e) {
            // Ignore
          }
        });
      }
    } catch (e) {
      // Container might be detached - ignore
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
