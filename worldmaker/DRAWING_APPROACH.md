# Correct Drawing Approach for Fantasy Maps

## Current Problem
- Using soft gradient brushes (wrong!)
- Semi-transparent overlapping strokes
- No clear borders/edges
- Doesn't look like Inkarnate or professional fantasy maps

## How Real Fantasy Map Tools Work

### Inkarnate / Wonderdraft / etc.
1. **Regions are solid colors** - no gradients, no alpha blending
2. **Clear borders** - dark outlines around water/land
3. **Fill tool** - paint entire regions at once
4. **Layered approach**:
   - Base: Parchment
   - Layer 1: Land masses (solid tan/brown)
   - Layer 2: Water (solid blue with dark border)
   - Layer 3: Ocean (darker blue with border)
   - Layer 4: Details (mountains, forests, etc.)

## Implementation Options

### Option A: Polygon/Shape Tool (Most Like Inkarnate)
**How it works:**
- Click to place points
- Close the shape
- Fill with solid color
- Stroke with border color

**Pros:**
- Most accurate to reference
- Clean, professional look
- Easy to edit regions

**Cons:**
- Bigger rewrite
- Need shape editing tools

### Option B: Solid Brush + Auto Border (Quick Fix)
**How it works:**
- Paint solid opaque color (no gradients)
- Automatically detect edges
- Draw border strokes around painted areas

**Pros:**
- Minimal code change
- Quick to implement
- Familiar brush workflow

**Cons:**
- Harder to make clean shapes
- Less precise than polygons

### Option C: Bucket Fill (Classic)
**How it works:**
- Flood fill algorithm
- Click to fill connected regions
- Add border option

**Pros:**
- Classic map-making tool
- Good for organic shapes
- Easy to use

**Cons:**
- Need to draw outlines first
- Can be tricky with gaps

## Recommended: Hybrid Approach

Start with **Option B** (quick fix), then add **Option A** later:

### Phase 1: Fix Current Brushes
1. Make brushes paint **solid opaque colors**
2. Remove gradients completely
3. Paint fills entire area
4. Add **border stroke toggle** - outlines painted regions

### Phase 2: Add Better Tools
1. Polygon region tool
2. Bucket fill
3. Border width control
4. Region editing

## Technical Changes Needed

### Make Brushes Solid
```javascript
// OLD (gradient, alpha)
function makeSoftStamp(ctx, x, y, radius, rgbaColor, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  // gradient stuff...
}

// NEW (solid circle)
function makeSolidStamp(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
```

### Add Border Strokes
```javascript
// Detect edges of painted regions
// Draw stroke along boundaries
function strokeRegionEdges(ctx, color, width) {
  // Use edge detection
  // Draw border around water/land
}
```

### Solid Colors
```javascript
const COLORS = {
  parchment: "#e8d7b8",

  // SOLID fills (no alpha)
  landFill: "#d4c4a8",      // solid tan
  waterFill: "#b8c8d8",     // solid pale blue
  oceanFill: "#8fa8bc",     // solid darker blue

  // Borders
  landBorder: "#6b5d52",
  waterBorder: "#5a7a8f",
  oceanBorder: "#3d5568",
};
```

## Visual Target

**What we want:**
```
[Parchment background]
  └─ [Land region: solid #d4c4a8 with #6b5d52 border]
  └─ [Water region: solid #b8c8d8 with #5a7a8f border]
  └─ [Ocean region: solid #8fa8bc with #3d5568 border]
  └─ [Mountains: ink symbols on top]
```

**Not this (current):**
```
[Parchment background]
  └─ [Soft gradient wash]
  └─ [More soft gradient wash]
  └─ [Blurry overlapping strokes]
```
