/**
 * MapService - Singleton service for managing Leaflet map instances
 * 
 * This service manages all map lifecycle outside of React's component lifecycle,
 * preventing race conditions and ensuring reliable cleanup.
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
  isContainerSafe(container: HTMLElement): boolean {
    if (!container) return false;
    
    // Check for Leaflet tracking properties
    if ((container as any)._leaflet_id) return false;
    if ((container as any)._leaflet) return false;
    
    // Check for Leaflet DOM elements
    if (container.querySelector('.leaflet-container')) return false;
    
    return true;
  }

  /**
   * Clean a container, removing all Leaflet artifacts
   * Uses innerHTML clearing for safety - avoids removeChild errors
   */
  cleanContainer(container: HTMLElement): void {
    if (!container) return;

    // First, try to call map.remove() on any Leaflet maps to properly clean them up
    // This is safer than trying to remove DOM nodes manually
    try {
      const leafletContainers = container.querySelectorAll('.leaflet-container');
      leafletContainers.forEach((el) => {
        try {
          const leafletEl = el as HTMLElement;
          if ((leafletEl as any)._leaflet_id) {
            const map = (leafletEl as any)._leaflet;
            if (map && typeof map.remove === 'function') {
              try {
                // Only remove if container is still in DOM
                if (map._container && map._container.parentNode) {
                  map.remove();
                }
              } catch (e) {
                // Ignore - map might already be removed
              }
            }
          }
        } catch (e) {
          // Ignore individual element errors
        }
      });
    } catch (e) {
      // Ignore querySelector errors
    }

    // Clear container properties first
    try {
      delete (container as any)._leaflet_id;
      delete (container as any)._leaflet;
    } catch (e) {
      // Ignore
    }

    // Safest approach: Clear innerHTML to remove all Leaflet elements
    // This avoids removeChild errors entirely
    try {
      // Check if container still exists and has Leaflet elements
      if (container.parentNode && container.querySelector('.leaflet-container')) {
        container.innerHTML = '';
      } else if (container.querySelector('.leaflet-container')) {
        // Container might be detached, but still clear it
        container.innerHTML = '';
      }
    } catch (e) {
      // Ignore - container might be removed
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
        console.warn(`Container ${containerId} is not safe after cleanup`);
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
   */
  destroyMap(containerId: string): void {
    const instance = this.mapInstances.get(containerId);
    
    if (instance) {
      try {
        const { map, container } = instance;
        
        // Remove map instance
        if (map && typeof map.remove === 'function') {
          try {
            // Check if container exists and is still in DOM before removing
            if (map._container) {
              const containerParent = map._container.parentNode;
              if (containerParent && containerParent.contains(map._container)) {
                map.remove();
              } else {
                // Container already removed from DOM, just clean properties
                delete (map._container as any)._leaflet_id;
                delete (map._container as any)._leaflet;
              }
            }
          } catch (e) {
            // If remove fails, force cleanup
            if (map._container) {
              try {
                // Only clear if container still exists
                const containerParent = map._container.parentNode;
                if (containerParent && containerParent.contains(map._container)) {
                  map._container.innerHTML = '';
                }
                delete (map._container as any)._leaflet_id;
                delete (map._container as any)._leaflet;
              } catch (e2) {
                // Ignore - container might be already removed
              }
            }
          }
        }
        
        // Clean container (this method now has safe removal checks)
        if (container) {
          this.cleanContainer(container);
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      
      // Remove from registry
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
