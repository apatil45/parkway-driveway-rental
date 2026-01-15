# Fresh Design - Map Container Architecture

## Core Principles

1. **Separation of Concerns**: Map lifecycle separate from React lifecycle
2. **Single Source of Truth**: One place manages map state
3. **Isolation**: Map container completely isolated from React re-renders
4. **Idempotency**: Operations can be safely repeated
5. **Fail-Safe**: Always recoverable, never stuck

## Architecture Design

### 1. Map Service Pattern (Singleton)

**Concept**: Centralized map manager outside React lifecycle

```typescript
class MapService {
  private static instance: MapService;
  private mapInstances: Map<string, LeafletMap> = new Map();
  private containerRegistry: Map<string, HTMLElement> = new Map();
  
  // Get or create map for a container
  getMap(containerId: string, container: HTMLElement): LeafletMap {
    // Check if container already has a map
    if (this.containerRegistry.has(containerId)) {
      const existingContainer = this.containerRegistry.get(containerId);
      if (existingContainer === container) {
        return this.mapInstances.get(containerId)!;
      }
      // Container changed - cleanup old one
      this.destroyMap(containerId);
    }
    
    // Create new map
    const map = L.map(container);
    this.mapInstances.set(containerId, map);
    this.containerRegistry.set(containerId, container);
    return map;
  }
  
  // Destroy map safely
  destroyMap(containerId: string): void {
    const map = this.mapInstances.get(containerId);
    if (map) {
      try {
        map.remove();
      } catch (e) {
        // Force cleanup
        const container = this.containerRegistry.get(containerId);
        if (container) {
          container.innerHTML = '';
          delete (container as any)._leaflet_id;
        }
      }
      this.mapInstances.delete(containerId);
      this.containerRegistry.delete(containerId);
    }
  }
  
  // Check if container is safe to use
  isContainerSafe(container: HTMLElement): boolean {
    return !(container as any)._leaflet_id && 
           !container.querySelector('.leaflet-container');
  }
}
```

**Benefits**:
- Single source of truth for all maps
- No React lifecycle dependencies
- Easy to track and cleanup
- Can be tested independently

### 2. Container Pool Pattern

**Concept**: Pre-allocate container divs, swap them instead of creating/destroying

```typescript
class ContainerPool {
  private pool: HTMLElement[] = [];
  private active: HTMLElement | null = null;
  
  getContainer(): HTMLElement {
    // Get from pool or create new
    const container = this.pool.pop() || document.createElement('div');
    this.cleanContainer(container);
    this.active = container;
    return container;
  }
  
  releaseContainer(container: HTMLElement): void {
    // Clean and return to pool
    this.cleanContainer(container);
    this.pool.push(container);
    if (this.active === container) {
      this.active = null;
    }
  }
  
  private cleanContainer(container: HTMLElement): void {
    // Remove all Leaflet artifacts
    container.innerHTML = '';
    delete (container as any)._leaflet_id;
    delete (container as any)._leaflet;
  }
}
```

**Benefits**:
- No DOM creation/destruction overhead
- Containers are always clean
- Fast switching
- Memory efficient (reuse)

### 3. Portal-Based Isolation

**Concept**: Render map in React Portal to completely isolate from parent

```typescript
function MapView({ center, markers }) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Create isolated container outside React tree
    const container = document.createElement('div');
    container.id = `map-container-${Date.now()}`;
    document.body.appendChild(container);
    setPortalContainer(container);
    
    return () => {
      // Cleanup on unmount
      MapService.destroyMap(container.id);
      document.body.removeChild(container);
    };
  }, []);
  
  return portalContainer ? (
    createPortal(
      <MapContainer container={portalContainer} />,
      portalContainer
    )
  ) : null;
}
```

**Benefits**:
- Complete DOM isolation
- No parent re-render interference
- Easy cleanup (just remove portal)
- No React key issues

### 4. State Machine with Explicit Transitions

**Concept**: Use a proper state machine library (XState) for lifecycle

```typescript
import { createMachine, interpret } from 'xstate';

const mapMachine = createMachine({
  id: 'map',
  initial: 'idle',
  states: {
    idle: {
      on: {
        MOUNT: 'cleaning'
      }
    },
    cleaning: {
      invoke: {
        src: 'cleanupContainer',
        onDone: 'ready',
        onError: 'error'
      }
    },
    ready: {
      on: {
        INITIALIZE: 'initializing'
      }
    },
    initializing: {
      invoke: {
        src: 'initializeMap',
        onDone: 'initialized',
        onError: 'error'
      }
    },
    initialized: {
      on: {
        UNMOUNT: 'cleaning',
        ERROR: 'error'
      }
    },
    error: {
      on: {
        RETRY: 'cleaning'
      }
    }
  }
});

// Use in component
const [state, send] = useMachine(mapMachine);
```

**Benefits**:
- Explicit state transitions
- Built-in error handling
- Easy to visualize
- Testable
- No race conditions (state machine prevents invalid transitions)

### 5. Container ID System

**Concept**: Use stable, unique IDs instead of React keys

```typescript
// Generate stable ID on mount, never change it
const containerIdRef = useRef(`map-${crypto.randomUUID()}`);

// Use ID to track container across renders
<div 
  id={containerIdRef.current}
  ref={containerRef}
>
  {/* Map renders here */}
</div>

// MapService uses ID to track
MapService.getMap(containerIdRef.current, containerRef.current);
```

**Benefits**:
- Stable reference across renders
- No key changes needed
- Easy to track in service
- Works with React reconciliation

### 6. Lazy Map Initialization

**Concept**: Don't initialize map until user actually needs it

```typescript
function MapView({ center, markers, lazy = true }) {
  const [shouldInitialize, setShouldInitialize] = useState(!lazy);
  
  // Only initialize when visible or user interacts
  useEffect(() => {
    if (lazy) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setShouldInitialize(true);
        }
      });
      
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
      
      return () => observer.disconnect();
    }
  }, [lazy]);
  
  return shouldInitialize ? <MapContainer /> : <MapPlaceholder />;
}
```

**Benefits**:
- Faster initial page load
- Only loads when needed
- Better performance
- Can combine with virtualization

### 7. Web Component Wrapper

**Concept**: Wrap Leaflet in a Web Component for complete isolation

```typescript
class LeafletMapElement extends HTMLElement {
  private map: LeafletMap | null = null;
  
  connectedCallback() {
    // Initialize when added to DOM
    this.map = L.map(this);
  }
  
  disconnectedCallback() {
    // Cleanup when removed from DOM
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  
  // Expose methods
  setCenter(lat: number, lng: number) {
    this.map?.setView([lat, lng]);
  }
}

customElements.define('leaflet-map', LeafletMapElement);

// Use in React
function MapView() {
  return <leaflet-map ref={mapRef} />;
}
```

**Benefits**:
- Complete lifecycle isolation
- Native browser lifecycle
- No React interference
- Can be used in any framework

### 8. Canvas-Based Rendering

**Concept**: Use Leaflet with canvas renderer, or custom canvas implementation

```typescript
// Leaflet supports canvas rendering
const map = L.map(container, {
  preferCanvas: true  // Use canvas instead of DOM
});

// Or custom canvas implementation
class CanvasMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  render() {
    // Draw map on canvas
    // No DOM manipulation
    // No _leaflet_id tracking
  }
}
```

**Benefits**:
- No DOM tracking issues
- Better performance
- No container reuse errors
- Works with any container

## Recommended Architecture (From Scratch)

### Hybrid Approach:

1. **Map Service** (Singleton)
   - Manages all map instances
   - Tracks containers by stable ID
   - Handles cleanup

2. **Container Pool** (Optional optimization)
   - Reuse containers for performance
   - Always clean containers

3. **Stable Container ID**
   - Generated once on mount
   - Never changes
   - Used as key in service

4. **State Machine** (XState)
   - Explicit lifecycle management
   - Prevents invalid states
   - Built-in error recovery

5. **Portal Isolation** (If needed)
   - Complete DOM isolation
   - No parent interference

### Implementation Flow:

```
1. Component mounts
   └─> Generate stable container ID
   └─> Create/get container from pool
   └─> Register with MapService

2. State machine: idle → cleaning
   └─> MapService.cleanContainer(containerId)
   └─> Verify clean
   └─> State: ready

3. State machine: ready → initializing
   └─> MapService.getMap(containerId, container)
   └─> MapService checks if container is safe
   └─> Creates map if safe
   └─> State: initialized

4. Component unmounts
   └─> State machine: initialized → cleaning
   └─> MapService.destroyMap(containerId)
   └─> Return container to pool
   └─> State: idle
```

## Key Differences from Current Approach

### Current:
- React manages lifecycle
- Keys change to force recreation
- Cleanup happens in React hooks
- Race conditions possible

### Fresh Design:
- Service manages lifecycle
- Stable IDs, no key changes
- Cleanup in service (outside React)
- State machine prevents race conditions

## Benefits of Fresh Design

1. **No Race Conditions**: State machine prevents invalid transitions
2. **Faster**: Container pool, lazy loading
3. **More Reliable**: Service pattern, stable IDs
4. **Easier to Test**: Service can be tested independently
5. **Framework Agnostic**: Service works with any framework
6. **Better Performance**: Optimizations built-in
7. **Easier to Debug**: Clear state transitions

## Trade-offs

### Pros:
- Much more reliable
- Better performance
- Easier to maintain
- More testable

### Cons:
- More initial setup
- Additional dependencies (XState)
- More complex architecture
- Learning curve

## Conclusion

If designing from scratch, I would use:
1. **MapService** (Singleton) - Core management
2. **State Machine** (XState) - Lifecycle control
3. **Stable Container IDs** - No key changes
4. **Container Pool** (Optional) - Performance
5. **Portal** (If needed) - Isolation

This would eliminate race conditions entirely and provide a much more robust foundation.
