# MapContainer Debugging - Understanding the Basics

## What We Need to Know

1. **What DOM element does MapContainer create?**
2. **Where does Leaflet attach `_leaflet_id`?**
3. **When does Leaflet initialize?**
4. **What triggers the "container is being reused" error?**

## Test: Add Console Logs

Let's add debugging to see exactly what's happening:

```typescript
// In MapView.tsx, add to MapContainer ref callback:

ref={(map) => {
  console.log('=== MapContainer ref callback ===');
  console.log('map:', map);
  console.log('containerRef.current:', containerRef.current);
  if (containerRef.current) {
    console.log('containerRef._leaflet_id:', (containerRef.current as any)._leaflet_id);
    console.log('Has leaflet-container children:', containerRef.current.querySelector('.leaflet-container'));
    console.log('All children:', Array.from(containerRef.current.children));
  }
  if (map) {
    console.log('map._container:', map._container);
    if (map._container) {
      console.log('map._container._leaflet_id:', (map._container as any)._leaflet_id);
      console.log('map._container === containerRef.current:', map._container === containerRef.current);
    }
  }
  
  // ... rest of ref callback
}}
```

## Expected Output

When MapContainer initializes, we should see:
- What `map._container` is
- Whether it's the same as `containerRef.current`
- Where `_leaflet_id` is attached
- What children exist

## Key Questions to Answer

1. **Does MapContainer use `containerRef.current` directly?**
   - If yes: `map._container === containerRef.current`
   - If no: `map._container` is a child of `containerRef.current`

2. **Where is `_leaflet_id` attached?**
   - On `containerRef.current`?
   - On a child div with class `leaflet-container`?

3. **When does the error occur?**
   - During ref callback?
   - During Leaflet initialization?
   - After initialization?

## Current Hypothesis

Based on react-leaflet documentation:
- MapContainer creates a div internally
- That div is where Leaflet initializes
- The div gets `_leaflet_id` attached
- The div is a **child** of whatever container MapContainer is in

So structure should be:
```
containerRef.current (our wrapper)
  └─ <div> (created by MapContainer, has leaflet-container class)
      └─ _leaflet_id attached here
```

But we need to verify this!
