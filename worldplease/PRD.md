# Product Requirements Document: Fantasy Map Sketcher

## 1. Overview

### 1.1 Product Vision
A web-based fantasy map creation tool that enables users to hand-draw landmasses, borders, roads, cities, and geographical features in a parchment and teal-ocean aesthetic style reminiscent of classic fantasy maps (e.g., Azgaar's Fantasy Map Generator style).

### 1.2 Target Users
- Tabletop RPG game masters and dungeon masters
- Fantasy authors and worldbuilders
- Game designers creating fantasy settings
- Hobbyist cartographers and artists

### 1.3 Core Value Proposition
Intuitive, artistic map creation with hand-drawn aesthetics, combining the organic feel of sketching with the convenience of digital tools and non-destructive editing.

---

## 2. Functional Requirements

### 2.1 Drawing Modes

#### 2.1.1 Land Mode (Freehand Drawing)
**Purpose**: Create landmasses by drawing organic, freeform shapes

**Requirements**:
- User can click and drag to draw a closed polygon outline
- On pointer release, the stroke automatically closes and smooths
- Smoothing level adjustable (1-6 iterations using Chaikin subdivision)
- Minimum stroke length required before creating landmass
- Visual preview of stroke while drawing (dashed line)
- Land automatically generates:
  - Parchment-colored fill (#eadbbf)
  - Ink-colored coastline stroke (2.2px)
  - Subtle inner shadow for depth
  - Paper grain texture overlay
  - Bathymetry rings (ocean depth visualization)

**User Stories**:
- As a user, I want to draw continents by hand so I can create organic-looking landmasses
- As a user, I want automatic smoothing so my rough sketches look polished
- As a user, I want to control smoothing intensity to balance between detail and polish

#### 2.1.2 Brush Mode (Add/Delete Tool)
**Purpose**: Paint or erase land with a circular brush tool

**Requirements**:
- Two sub-modes: Add Land / Delete Land
- Toggle between add and delete actions via UI buttons
- Adjustable brush size: 10-100 pixels (world-space units)
- Visual cursor preview showing:
  - Dashed circle outline
  - Green tint for add mode
  - Red tint for delete mode
- Continuous painting while dragging
- **Add mode merges brush strokes into continuous landmasses** (not individual circles)
- **Brush strokes create unified regions by merging overlapping circles**
- Delete mode removes land polygons that intersect with brush
- Real-time feedback during painting
- Changes integrated into undo/redo history
- **Single undo snapshot per complete brush stroke** (not per circle)

**User Stories**:
- As a user, I want to paint land details so I can refine coastlines
- As a user, I want to erase land so I can create bays and inlets
- As a user, I want adjustable brush size for both broad strokes and fine details
- As a user, I want visual feedback of brush size before painting
- As a user, I want my brush strokes to create smooth continuous land, not disconnected circles

**Technical Note**:
Brush strokes should accumulate into a single land polygon per stroke, merging overlapping circles into a unified shape. This prevents polygon explosion and creates cleaner, more efficient landmasses.

#### 2.1.3 Region Fill Mode (Flood Fill)
**Purpose**: Color interior regions of landmasses with pastel tones

**Requirements**:
- Click inside land to flood-fill contiguous area
- Respects borders and coastlines as boundaries
- 12 preset pastel colors in palette:
  - #f2c6bf, #dfe7a7, #c7e6de, #d7c7ea, #f0d3a9, #cfe0f0
  - #f3d0e5, #cfe8c7, #ead9b6, #d8e6f5, #f5e2b8, #d5d1f2
- Random pastel color generator
- Color selection via swatch UI
- Translucent fill (alpha ~220/255)
- Region data stored as raster texture (1000px base resolution)
- Manual barrier mask rebuild option
- Fills only work within land polygons
- Borders act as walls preventing fill spread

**User Stories**:
- As a user, I want to color different kingdoms so I can distinguish territories
- As a user, I want borders to block fills so regions stay contained
- As a user, I want random color generation for quick experimentation

#### 2.1.4 Border Mode (Political Boundaries)
**Purpose**: Draw boundary lines that define fillable regions for kingdoms/districts

**Requirements**:
- Click to place waypoints
- Preview line segment to cursor position
- Press Enter to finalize polyline
- Press Escape to cancel current line
- Default style: dashed (6px dash, 5px gap)
- Default width: 2.5px
- Ink color with transparency (rgba(43,36,28,0.35))
- Customizable line width (0.8-12px)
- Customizable dash pattern (comma-separated values)
- **Borders automatically create bounded regions** (polygons)
- **Each bordered region can be filled with a distinct color** (for kingdoms/districts)
- Borders act as barriers in region fill operations
- White halo for readability
- **Closed border loops define new fillable regions**

**User Stories**:
- As a user, I want to draw borders so I can mark political boundaries
- As a user, I want dashed lines so borders look like traditional map conventions
- As a user, I want borders to automatically create regions I can fill with different colors
- As a user, I want to define kingdoms by drawing their borders and then filling them
- As a user, I want borders to block region fills so kingdoms don't bleed together

**Technical Note**:
Borders that form closed loops should automatically create region polygons that can be filled independently. The region fill mode should recognize these bordered regions as distinct fillable areas, allowing different kingdoms/districts to have different colors.

#### 2.1.5 Road Mode (Transportation Routes)
**Purpose**: Draw styled roads that look like fantasy map travel routes

**Requirements**:
- Same interaction as Border mode (waypoint-based)
- **Fantasy road styling options**:
  - Parallel double lines (classic cartographic style)
  - Dashed/dotted patterns for different road types
  - Varying thickness for major roads vs trails
  - Optional decorative elements (cross-hatching, dots)
- **Multiple road types**:
  - Major Road: Double parallel lines (2-3px apart)
  - Minor Road: Single solid line (1.5-2px)
  - Trail/Path: Dotted or short-dashed line (1px)
- Default style: Double parallel lines for major roads
- Lighter ink color (rgba(43,36,28,0.28))
- Customizable line width and pattern
- Does NOT act as barrier for region fills
- Press Enter to finalize, Escape to cancel
- **Roads should visually integrate with terrain** (subtle, hand-drawn appearance)

**User Stories**:
- As a user, I want roads that look like traditional fantasy map roads
- As a user, I want different road styles to show road importance (major highways vs small trails)
- As a user, I want roads to look hand-drawn and artistic, not like modern mapping software
- As a user, I want road styling distinct from borders for clear visual hierarchy

**Visual Reference**:
Roads should resemble those in classic fantasy maps:
- Tolkien-style maps: parallel lines with subtle irregularity
- D&D maps: double-line roads with slight waviness
- Avoid: Straight, uniform, computer-generated appearance

**Technical Note**:
Road rendering should include options for parallel line drawing, where two offset paths are drawn for the road edges. This creates the classic "double-line road" look common in fantasy cartography.

#### 2.1.6 Cities/Places Mode (Point Markers)
**Purpose**: Place named settlements and locations

**Requirements**:
- Click to place marker at location
- Types: City, Capital, Town, Fort, Port
- Each marker has:
  - Circular icon (7-9px radius)
  - Distinct fill color (capitals are gold-tinted)
  - Ink outline stroke
  - Text label (name)
- Name input field in sidebar
- Editable in Select mode
- Auto-labels as "(unnamed)" if blank

**User Stories**:
- As a user, I want to mark cities so I can show settlements
- As a user, I want different city types so I can show hierarchy
- As a user, I want to name cities so they're identifiable

#### 2.1.7 Geography Mode (Terrain Markers)
**Purpose**: Place geographical feature markers with appropriate icons

**Requirements**:
- Click to place marker
- Types: Mountain, Forest, Swamp, Ruin, Arcane Sigil, Bridge
- **Each marker displays as a custom icon/symbol**:
  - Mountains: Triangle/peak icon or mountain range symbol
  - Forest: Tree cluster or stylized forest icon
  - Swamp: Grass tufts or swamp vegetation icon
  - Ruin: Broken column or castle ruins icon
  - Arcane Sigil: Mystical symbol or magic circle
  - Bridge: Simple bridge or crossing icon
- **Icon rendering**:
  - Custom SVG or image-based icons (preferred)
  - Generic placeholder icon if custom icon not provided
  - Icons sized appropriately (12-24px depending on zoom)
  - Ink-colored icons with subtle shadow/outline
  - Icons scale with zoom level
- Optional text label positioned near icon
- Label input field in sidebar
- Editable in Select mode
- **Icons should look hand-drawn to match map aesthetic**

**User Stories**:
- As a user, I want mountain ranges to display as mountain icons, not circles
- As a user, I want forests to show tree symbols so they're immediately recognizable
- As a user, I want icons that match the hand-drawn fantasy map aesthetic
- As a user, I want optional labels for named features (e.g., "The Glass Scar")
- As a user, I want icons to remain visible and clear at different zoom levels

**Technical Note**:
Icons should be rendered as SVG paths or loaded images. If no custom icon is provided, use a simple geometric placeholder that's appropriate for the feature type. All icons should be rendered in the ink color (#2b241c) with optional subtle effects to integrate with the parchment aesthetic.

**Default Icon Specifications**:
- Mountain: Triangle or simple peaked shape
- Forest: Circular cluster with 3-5 small circles (representing tree canopies)
- Swamp: Wavy lines or grass-like marks
- Ruin: Square with broken edges
- Arcane Sigil: Circle with cross or star pattern
- Bridge: Two parallel lines with connecting segment

#### 2.1.8 Select Mode (Editing Tool)
**Purpose**: Select and modify existing map elements

**Requirements**:
- Click to select objects (priority: Places > Lines > Land)
- Visual selection highlight:
  - Teal glow around selected object
  - Thicker stroke outline
- Edit name/label for places and geography
- Delete selected object with Delete/Backspace key or button
- Apply changes button
- Selection info displayed in sidebar
- Deselect by clicking empty area

**User Stories**:
- As a user, I want to rename cities after placing them
- As a user, I want to delete mistakes without clearing everything
- As a user, I want visual feedback showing what's selected

### 2.2 Canvas Interaction

#### 2.2.1 Pan and Zoom
**Requirements**:
- Hold Space + drag to pan camera
- Mouse wheel to zoom (0.25x - 4.0x range)
- Zoom centers on cursor position
- Smooth zoom interpolation
- Current view state persists in save data

**User Stories**:
- As a user, I want to pan around large maps so I can work on different areas
- As a user, I want to zoom in for detail work and out for overview

#### 2.2.2 World Space
**Requirements**:
- Fixed world dimensions: 2000 x 1200 units
- All drawing happens in world coordinates
- View transform (pan/zoom) independent of world data
- World coordinates clamped to bounds
- Initial view: centered, 0.75x scale

### 2.3 Layer System

**Requirements**:
- Toggle visibility of layer categories:
  - All (default)
  - Land only
  - Regions only
  - Borders only
  - Roads only
  - Places only
- Layer filtering affects render only, not selection
- Visual indicator of active layer filter

**User Stories**:
- As a user, I want to hide layers so I can focus on specific aspects
- As a user, I want to see only borders to check political boundaries

### 2.4 History System (Undo/Redo)

**Requirements**:
- Automatic snapshot before destructive operations
- Undo: Ctrl/Cmd + Z
- Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
- Unlimited undo history (memory-permitting)
- Snapshots include:
  - All vector data (land, borders, roads, places)
  - Raster region data (PNG)
  - Current view state
- UI buttons show enabled/disabled state
- Future history cleared on new action after undo

**User Stories**:
- As a user, I want unlimited undo so I can experiment freely
- As a user, I want keyboard shortcuts for quick undo/redo
- As a user, I want visual feedback on undo/redo availability

### 2.5 Data Persistence

#### 2.5.1 Export
**Requirements**:
- Export to structured document format (JSON, XML, or custom format)
- Export includes:
  - Format version number (for future migration)
  - Document metadata (created, modified dates, author)
  - World dimensions and settings
  - Current viewport state
  - All layer data:
    - Land polygons with properties
    - Borders with styling
    - Roads with styling
    - Regions with fills
    - Markers with positions and labels
  - Region fill data (raster or vector)
  - Optional: embedded textures, icons
- Export options:
  - Pretty-printed for human readability
  - Minified for smaller file size
  - Compressed for very large maps
- Copy to clipboard or save to file

**User Stories**:
- As a user, I want to save my work so I can continue later
- As a user, I want a format I can potentially edit manually or with scripts
- As a user, I want to share maps with others
- As a user, I want version control friendly formats (git-compatible)

#### 2.5.2 Import
**Requirements**:
- Load from file or paste from clipboard
- Format validation:
  - Check version number
  - Validate schema
  - Handle missing or corrupt data gracefully
- Progressive loading for large maps
- Restore all layers and state
- Rebuild computed data (barrier masks, spatial indices)
- Error handling with specific messages
- Import creates undo snapshot
- Support for legacy format migration

**User Stories**:
- As a user, I want to load saved maps so I can continue working
- As a user, I want clear error messages if the file is corrupted
- As a user, I want to load maps from older versions of the app

### 2.6 Utility Functions

#### 2.6.1 Clear Canvas
**Requirements**:
- Remove all data (land, borders, roads, places, regions)
- Confirmation required (button press)
- Creates undo snapshot
- Resets all internal state
- Visual "danger" styling on button

**User Stories**:
- As a user, I want to start fresh without reloading the page

#### 2.6.2 Rebuild Fill Mask
**Requirements**:
- Manual trigger to regenerate barrier mask
- Useful after import or corruption
- Recalculates which areas are fillable
- Button in Region Fill options

---

## 3. Visual Design Requirements

### 3.1 Art Style
**Theme**: Hand-drawn fantasy map with parchment aesthetic

**Color Palette**:
- Ocean: #5f7770 (teal-gray)
- Land: #eadbbf (parchment)
- Ink: #2b241c (dark brown)
- UI Background: #0a0b10 (near-black)
- UI Panel: rgba(25,24,28,0.78) (dark translucent)
- Accent: #a7d0ca (teal)
- Text: #f3efe6 (off-white)

### 3.2 Visual Effects

#### Ocean Rendering
- Solid teal-gray fill
- Radial vignette (subtle darkening at edges)
- Paper grain texture overlay (18% opacity)

#### Land Rendering
- Parchment fill color
- Coastline: 2.2px dark ink stroke
- Inner shadow: subtle 10px black stroke at 8% opacity
- Paper grain overlay: 22% opacity, clipped to land
- Bathymetry rings: 4 concentric strokes around land (260-620px wide, translucent)

#### Region Fills
- Translucent pastel colors (alpha 220)
- Rendered above land, below borders
- Smooth image scaling

#### Lines (Borders/Roads)
- Customizable width and dash pattern
- White halo for readability (subtle)
- Preview dashed line to cursor while drawing

#### Places/Geography
- Circular markers (7-9px radius)
- Fill color varies by type
- 2px ink outline
- Text label offset to right
- Selection highlight: 3px teal stroke on larger circle

### 3.3 UI Design

#### Layout
- Two-column grid: 360px sidebar + flexible canvas
- Sidebar: scrollable, dark gradient background with teal accent
- Cards: rounded corners (14px), translucent dark panels, subtle shadow
- Buttons: rounded (12px), translucent, hover/active states
- Inputs: rounded (12px), dark background, teal accent on focus

#### Typography
- Sans-serif system font stack
- Labels: 11px, muted color
- Buttons: 12px, bold, off-white
- Headings: 15px, letter-spaced

#### Interactive Elements
- Toggle buttons: grouped, active state with teal outline/fill
- Sliders: range input for brush size
- Swatches: 6-column grid, selected state with white border
- Pills: rounded badges for info display
- Keyboard hints: monospace, small chips

#### Status Bar
- Bottom-left overlay on canvas
- Non-interactive pills showing shortcuts
- Translucent background

---

## 4. Technical Requirements

### 4.1 Architecture Principles

**Technology Agnostic**: This application can be implemented using any technology stack capable of:
- 2D vector and raster graphics rendering
- Interactive canvas or drawing surface
- Client-side state management
- File import/export capabilities

**Recommended Capabilities**:
- Vector graphics rendering (SVG, Canvas, or equivalent)
- Raster image manipulation for region fills
- Interactive event handling (mouse, touch, keyboard)
- Undo/redo state management
- Serialization/deserialization for save/load

**Architecture Pattern**: Model-View-Controller (MVC) or similar separation:
- **Model**: Core data structures and business logic
- **View**: Rendering engine and visual presentation
- **Controller**: User input handling and state coordination

### 4.2 Data Model (Abstract Design)

The application state should be organized into well-defined domain entities with clear separation of concerns.

#### Core Entities

**MapDocument**
```
MapDocument {
  id: UniqueId
  metadata: {
    version: string
    created: timestamp
    modified: timestamp
    worldDimensions: {width, height}
  }
  layers: LayerCollection
  viewport: ViewportState
}
```

**LayerCollection**
```
LayerCollection {
  landLayer: LandLayer
  regionLayer: RegionLayer
  borderLayer: LineLayer
  roadLayer: LineLayer
  placesLayer: MarkerLayer
  geographyLayer: MarkerLayer
}
```

**LandLayer**
```
LandLayer {
  polygons: List<LandPolygon>

  methods:
    - addPolygon(points, smoothing)
    - removePolygon(id)
    - mergePolygons(ids[])
    - getPolygonAt(worldPoint)
}

LandPolygon {
  id: UniqueId
  points: List<Point2D>
  properties: {
    smoothingLevel: number
    name: optional<string>
  }
}
```

**RegionLayer**
```
RegionLayer {
  regions: List<Region>
  fillTexture: RasterSurface  // Hybrid raster storage for fills

  methods:
    - createRegionFromBorder(borderPath)
    - fillRegion(regionId, color)
    - getRegionAt(worldPoint)
    - rebuildBarrierMask()
}

Region {
  id: UniqueId
  boundary: Polygon or BorderReference
  fill: {
    type: 'solid' | 'pattern' | 'gradient'
    color: Color
    opacity: number
  }
  metadata: {
    name: optional<string>
    kingdom: optional<string>
  }
}
```

**LineLayer** (for Borders and Roads)
```
LineLayer {
  lines: List<Line>

  methods:
    - addLine(points, style)
    - removeLine(id)
    - getLineAt(worldPoint, tolerance)
    - detectClosedLoops()  // For borders creating regions
}

Line {
  id: UniqueId
  type: 'border' | 'road'
  points: List<Point2D>
  style: LineStyle
  isClosed: boolean
}

LineStyle {
  width: number
  dashPattern: List<number>  // empty for solid
  roadType: optional<'major' | 'minor' | 'trail'>  // for roads
  renderMode: 'single' | 'double-parallel'  // for roads
}
```

**MarkerLayer** (for Places and Geography)
```
MarkerLayer {
  markers: List<Marker>

  methods:
    - addMarker(position, type, label)
    - removeMarker(id)
    - getMarkerAt(worldPoint, tolerance)
}

Marker {
  id: UniqueId
  category: 'settlement' | 'geography'
  type: string  // city, capital, mountain, forest, etc.
  position: Point2D
  label: string
  icon: IconReference or IconPath
  zoomScaling: boolean
}
```

**ViewportState**
```
ViewportState {
  panOffset: {x, y}
  zoomLevel: number  // 0.25 to 4.0

  methods:
    - worldToScreen(worldPoint)
    - screenToWorld(screenPoint)
    - zoomToPoint(screenPoint, delta)
    - pan(delta)
}
```

**HistoryManager**
```
HistoryManager {
  undoStack: List<Snapshot>
  redoStack: List<Snapshot>
  maxStackSize: number

  methods:
    - pushState(mapDocument)
    - undo()
    - redo()
    - canUndo()
    - canRedo()
    - clear()
}

Snapshot {
  timestamp: timestamp
  documentState: SerializedMapDocument
  description: string  // "Added land polygon", "Drew border", etc.
}
```

#### Supporting Types

**Point2D**
```
Point2D {
  x: number
  y: number
}
```

**Color**
```
Color {
  r: 0-255
  g: 0-255
  b: 0-255
  a: 0-1
}
```

**Polygon**
```
Polygon {
  points: List<Point2D>

  methods:
    - contains(point)
    - intersects(otherPolygon)
    - getBounds()
    - simplify(tolerance)
    - smooth(iterations)
}
```

#### Data Abstraction Benefits

1. **Clear Separation**: Each layer manages its own entities
2. **Type Safety**: Strongly typed entities with clear contracts
3. **Encapsulation**: Business logic lives with the data it operates on
4. **Testability**: Each entity can be unit tested independently
5. **Extensibility**: Easy to add new layer types or entity properties
6. **Serialization**: Well-defined structure makes save/load straightforward
7. **Technology Agnostic**: Can be implemented in any OOP language

### 4.3 Rendering System

**Rendering Pipeline** (Z-Order, back to front):

1. **Background Layer** (Screen Space)
   - Ocean fill with vignette effect
   - Paper grain texture overlay

2. **World Transform Begin**
   - Apply viewport translation (pan)
   - Apply viewport scaling (zoom)

3. **Bathymetry Layer** (Optional, based on layer visibility)
   - Concentric rings around land masses
   - Multiple semi-transparent strokes

4. **Region Fill Layer** (Optional, based on layer visibility)
   - Raster texture with kingdom/district colors
   - Rendered with transparency
   - Interpolated/filtered for smooth appearance

5. **Land Layer** (Optional, based on layer visibility)
   - Fill land polygons with parchment color
   - Render inner shadow for depth
   - Render coastline strokes
   - Apply paper grain texture (clipped to land)

6. **Border Layer** (Optional, based on layer visibility)
   - Render border polylines with styling
   - White halo for readability
   - Dashed patterns

7. **Road Layer** (Optional, based on layer visibility)
   - Render road polylines
   - Double-parallel lines for major roads
   - Single lines for trails
   - Subtle integration with terrain

8. **Place Markers Layer** (Optional, based on layer visibility)
   - Render settlement icons/circles
   - Render settlement labels
   - Apply selection highlights if selected

9. **Geography Markers Layer** (Optional, based on layer visibility)
   - Render terrain feature icons
   - Render feature labels
   - Apply selection highlights if selected

10. **Interaction Layer** (Always visible)
    - Current drawing preview (land stroke, line preview)
    - Brush cursor visualization
    - Selection highlights
    - Hover effects

11. **World Transform End**
    - Restore coordinate system

12. **UI Overlay Layer** (Screen Space)
    - Status bar with keyboard shortcuts
    - Any on-canvas widgets

**Rendering Abstractions**:

```
RenderContext {
  methods:
    - setTransform(viewport)
    - drawPolygon(points, fill, stroke)
    - drawPolyline(points, style)
    - drawCircle(center, radius, fill, stroke)
    - drawIcon(position, iconDef, scale)
    - drawText(position, text, style)
    - setClip(polygon)
    - clearClip()
    - applyTexture(texture, region)
}
```

**Performance Guidelines**:
- Pre-compute and cache complex paths (bathymetry, grain patterns)
- Use appropriate resolution for raster components (region fills)
- Implement dirty region tracking (only redraw changed areas)
- Throttle rendering during continuous input (mouse/touch move)
- Use spatial indexing for hit detection
- Implement level-of-detail (LOD) for complex elements at different zoom levels
- Consider GPU acceleration where available

### 4.4 Geometry Processing Algorithms

**Path Simplification**
- Algorithm: Ramer-Douglas-Peucker or similar
- Purpose: Reduce point count in freehand strokes
- Parameters: Tolerance distance in world units
- Application: Pre-process before smoothing or storing

**Polygon Smoothing**
- Algorithm: Chaikin subdivision (corner cutting)
- Purpose: Create organic-looking coastlines from rough sketches
- Parameters: Iteration count (1-6), configurable per polygon
- Application: Applied to closed polygons (land masses)
- Preserves: General shape and topology

**Polygon Merging** (Critical for Brush Tool)
- Algorithm: Boolean union operation (CSG)
- Purpose: Combine overlapping brush circles into unified land
- Alternative: Convex hull or alpha shapes for simpler merging
- Application: On brush stroke completion
- Libraries to consider: Clipper, Boost.Geometry, CGAL, martinez-polygon-clipping

**Flood Fill**
- Algorithm: BFS (Breadth-First Search) or scanline
- Purpose: Fill contiguous regions with color
- Data structure: Barrier mask (raster, boolean grid)
- Barriers: Land boundaries, border lines
- Application: Region coloring for kingdoms/districts

**Closed Loop Detection**
- Algorithm: Path analysis to detect closed polylines
- Purpose: Identify borders that form complete regions
- Heuristic: First and last points within threshold distance
- Application: Auto-create fillable regions from borders

**Parallel Line Generation** (For Roads)
- Algorithm: Offset path generation
- Purpose: Create double-line roads from single centerline
- Parameters: Offset distance, number of parallel lines
- Challenges: Handle sharp corners, intersections, self-intersections

**Icon Placement and Scaling**
- Algorithm: Transform icon paths based on zoom level
- Purpose: Maintain icon visibility at different scales
- Scaling options:
  - Fixed screen size (icons stay same pixel size)
  - Proportional to zoom (icons grow/shrink with map)
  - Hybrid (minimum size, maximum size constraints)

### 4.5 Input Handling System

**Input Controller**
```
InputController {
  currentMode: DrawingMode
  currentTool: Tool

  methods:
    - handlePointerDown(position)
    - handlePointerMove(position)
    - handlePointerUp(position)
    - handleKeyDown(key, modifiers)
    - handleKeyUp(key)
    - handleWheel(delta, position)
    - transformCoordinates(screenPos) -> worldPos
}
```

**Pointer Events** (Mouse, Touch, Pen):
- **Down**: Initiate drawing, start selection, begin pan
- **Move**: Continue drawing, update hover, pan if active
- **Up**: Complete drawing operation, finalize selection
- **Wheel**: Zoom centered on cursor position

**Keyboard Shortcuts**:
| Key | Modifiers | Action |
|-----|-----------|--------|
| Space | - | Toggle pan mode (hold) |
| Enter | - | Finalize current polyline (borders/roads) |
| Escape | - | Cancel current operation |
| Delete/Backspace | - | Delete selected element |
| Z | Ctrl/Cmd | Undo |
| Z | Ctrl/Cmd + Shift | Redo |
| Y | Ctrl/Cmd | Redo (alternate) |

**Mode-Specific Behavior**:
- Each drawing mode handles input differently
- State machine pattern for mode transitions
- Preview rendering during interactive operations

### 4.6 Platform Requirements

**Core Capabilities Required**:
- 2D graphics rendering (vector and raster)
- Image manipulation (for region fills, textures)
- Event handling (pointer, keyboard, wheel)
- Coordinate transformation math
- File I/O or serialization
- Clipboard access (for copy/paste - future feature)

**Target Platforms**:
- **Web**: Modern browsers with Canvas/SVG support
- **Desktop**: Electron, Tauri, native app frameworks
- **Mobile**: Responsive design, touch-optimized (future consideration)

**Performance Targets**:
- Smooth rendering at 60 FPS during pan/zoom
- <100ms response time for mode changes
- <16ms per frame during interactive drawing
- Support for maps with 1000+ polygons without degradation

---

## 5. User Experience Requirements

### 5.1 Onboarding
- Clear mode labels and descriptions
- Contextual hints in each mode section
- Keyboard shortcut reminders visible in status bar
- No tutorial required (intuitive UI)

### 5.2 Workflow
**Typical User Journey**:
1. Draw landmasses (Land or Brush mode)
2. Draw borders between regions (Border mode)
3. Fill regions with colors (Region Fill mode)
4. Add roads (Road mode)
5. Place cities and features (Places/Geography modes)
6. Refine by selecting and editing (Select mode)
7. Export to JSON

### 5.3 Error Handling
- Invalid JSON import: display error message
- Empty land stroke: silently ignore
- Failed image load: graceful fallback
- Barrier mask corruption: manual rebuild option

### 5.4 Performance Expectations
- Smooth panning and zooming
- Real-time drawing preview
- <100ms response to mode changes
- <500ms for complex undo/redo
- Support maps with 100+ land polygons

---

## 6. Future Enhancements (Out of Scope)

### 6.1 Not Included in V1
- PNG/SVG export
- Image backgrounds
- Text labels on map
- Line/polygon editing (moving vertices)
- Copy/paste elements
- Layers with independent visibility toggles
- Collaborative editing
- Terrain brushes (forests, mountains as repeated patterns)
- Snapping and alignment tools
- Measurement tools
- Grids and hex overlays

### 6.2 Potential V2 Features
- Export to image formats
- Pre-made templates/continents
- Procedural generation options
- Advanced border styles (dotted, double-line, etc.)
- Symbol library for icons
- Path editing (reshape after creation)
- Clone/duplicate tools
- Better boolean operations for brush (proper CSG)

---

## 7. Success Metrics

### 7.1 Functional Completeness
- ✅ All 8 modes implemented and functional
- ✅ Undo/redo works for all operations
- ✅ Save/load preserves full map state
- ✅ Layer toggles work correctly
- ✅ Keyboard shortcuts functional

### 7.2 Quality Metrics
- Visual style matches parchment aesthetic
- Smooth interaction (no lag during drawing)
- No data loss on save/load cycle
- Intuitive UI (users can draw a basic map without help)

### 7.3 User Satisfaction
- Users can create a complete map in <30 minutes
- Exported maps are visually appealing
- Users understand all modes without documentation

---

## 8. Known Limitations

### 8.1 Technical Constraints
- Browser-only (no offline mode without setup)
- Region data is raster (limited resolution)
- Brush delete is simplistic (removes entire polygons if any point intersects)
- No proper polygon boolean operations (union/subtract)
- Single undo per stroke (can't undo individual brush dabs)
- No multi-select or bulk operations

### 8.2 Design Trade-offs
- Favor simplicity over advanced features
- Vector + raster hybrid (not pure vector)
- Single-user only (no collaboration)
- Limited styling options (no fonts, stroke styles)
- No export to standard formats (JSON only)

---

## 9. Critical Implementation Fixes (Priority 1)

### 9.1 Brush Mode - Merge Circles into Regions
**Current Issue**: Brush creates individual circle polygons instead of unified landmasses
**Required Fix**: Accumulate brush strokes and merge overlapping circles into single polygon per stroke
**Implementation Approach**:
- Collect all circle points during a brush stroke
- On pointerup, merge all overlapping circles using union operation
- Create single land polygon from merged result
- Alternative: Use convex hull or alpha shapes for simpler merging

### 9.2 Borders Create Regions
**Current Issue**: Borders only act as barriers, don't define fillable regions
**Required Fix**: Closed border loops should create distinct region polygons
**Implementation Approach**:
- Detect when borders form closed loops
- Generate region polygons from closed border paths
- Allow independent color filling of each region
- Maintain region-to-border association

### 9.3 Geography Icons
**Current Issue**: Geography markers show as circles, not recognizable symbols
**Required Fix**: Render appropriate icons for each terrain type
**Implementation Approach**:
- Create SVG path definitions for each icon type
- Render icons in canvas using path drawing
- Fallback to simple geometric shapes if custom icons unavailable
- Scale icons with zoom level

### 9.4 Fantasy Road Styling
**Current Issue**: Roads are plain lines, not fantasy-styled
**Required Fix**: Implement double-line parallel road drawing
**Implementation Approach**:
- Calculate offset paths parallel to main road path
- Draw two parallel lines with small gap between
- Add optional decorative elements (cross-hatching)
- Support multiple road styles (major/minor/trail)

## 10. Open Questions / Areas for Improvement

1. **Brush Mode Merging**: Consider:
   - Proper CSG (Constructive Solid Geometry) operations
   - Path merging to reduce polygon count
   - Smarter intersection detection
   - Libraries: clipper-lib, polygon-clipping, martinez-polygon-clipping

2. **Region Management**: With borders creating regions, consider:
   - Region data structure (polygon + metadata)
   - Region fill as vector data instead of raster
   - Multiple fills per region (patterns, gradients)
   - Region naming and labeling

3. **Road Type System**: Expand road variety:
   - Road type selector in UI
   - Presets for different road styles
   - Custom road patterns
   - Road width based on type (highway vs trail)

4. **Icon Customization**: Allow users to provide custom icons:
   - Icon upload/import system
   - Icon library/palette
   - User-defined icon types
   - Icon color/size customization

5. **Performance**: Many overlapping polygons from various operations. Consider:
   - Automatic polygon merging/simplification
   - Spatial indexing for hit testing
   - Level-of-detail rendering
   - Caching merged geometry

6. **Barrier Mask**: Rebuilt from scratch on every land/border change. Consider:
   - Incremental updates
   - Caching strategy
   - GPU-accelerated mask generation

7. **Export Format**: JSON is not portable. Consider:
   - SVG export (vector graphics)
   - PNG export (raster image)
   - PDF export (print-ready)
   - GeoJSON (if adding real-world mapping)

---

## 11. Implementation Technology Recommendations

This PRD is technology-agnostic, but here are proven approaches for different implementation contexts:

### 11.1 Web Implementation

**Frontend Frameworks**:
- **React + Canvas**: Component-based UI with canvas rendering
- **Vue + Canvas**: Reactive UI with canvas integration
- **Svelte + Canvas**: Lightweight, compiled components
- **Vanilla JS + Canvas**: Direct DOM manipulation, no framework overhead

**Rendering Libraries**:
- **Konva.js**: High-level canvas API with scene graph
- **Fabric.js**: Object-oriented canvas library
- **Paper.js**: Vector graphics scripting
- **PixiJS**: WebGL-accelerated 2D rendering
- **Raw Canvas API**: Direct control, best performance

**Geometry Libraries**:
- **martinez-polygon-clipping**: Boolean operations on polygons
- **polygon-clipping**: Lightweight CSG operations
- **Turf.js**: Geospatial operations (if adding GIS features)
- **d3-polygon**: Polygon utilities

**State Management**:
- **Redux**: Predictable state container, great for undo/redo
- **MobX**: Observable state
- **Zustand**: Lightweight state management
- **XState**: State machines for mode management

### 11.2 Desktop Implementation

**Electron** (Web technologies packaged as desktop app):
- Pros: Reuse web codebase, cross-platform
- Cons: Large bundle size, memory usage

**Tauri** (Rust + Web frontend):
- Pros: Small bundle size, secure, fast
- Cons: Newer ecosystem

**Native Frameworks**:
- **Qt (C++)**: Mature, powerful graphics
- **WPF (C#)**: Windows-focused, XAML UI
- **JavaFX (Java)**: Cross-platform, mature
- **Flutter (Dart)**: Modern, cross-platform

### 11.3 Game Engine Approach

**Unity** (C#):
- Pros: Powerful 2D tools, mature ecosystem
- Cons: Overkill for 2D drawing app

**Godot** (GDScript/C#):
- Pros: Lightweight, open-source, good 2D support
- Cons: Less tooling for traditional UI

**Love2D** (Lua):
- Pros: Simple, fast, great for 2D
- Cons: Manual UI implementation

### 11.4 Architecture Recommendations

**Recommended Patterns**:
1. **Command Pattern**: For undo/redo system
2. **Strategy Pattern**: For different drawing modes
3. **Observer Pattern**: For UI updates on state changes
4. **Factory Pattern**: For creating map elements
5. **Composite Pattern**: For grouping map layers

**Code Organization**:
```
/src
  /domain          # Core entities (MapDocument, Layers, etc.)
  /rendering       # Rendering system
  /input           # Input handling
  /geometry        # Geometry algorithms
  /persistence     # Save/load
  /ui              # User interface components
  /utils           # Helper functions
```

**Testing Strategy**:
- Unit tests for geometry algorithms
- Unit tests for state management
- Integration tests for mode transitions
- Visual regression tests for rendering
- E2E tests for complete workflows

### 11.5 Third-Party Library Considerations

**Polygon Operations** (Critical):
- **Must Have**: Boolean union for brush merging
- **Options**:
  - JavaScript: martinez-polygon-clipping, polygon-clipping
  - C++: Clipper, Boost.Geometry, CGAL
  - Python: Shapely
  - Rust: geo crate
  - Java: JTS Topology Suite

**Icon/Symbol Rendering**:
- **SVG Path Rendering**: Most flexible
- **Icon Fonts**: Lightweight, scalable
- **Bitmap Sprites**: Fast but less flexible
- **Procedural Generation**: Most flexible, complex

**Performance Optimization**:
- **Spatial Indexing**: R-tree for fast hit detection
- **Libraries**: rbush (JS), Boost.Geometry (C++), rtree (Python)

### 11.6 Development Priorities

**Phase 1: Core Drawing** (MVP)
1. Basic rendering pipeline
2. Land mode with freehand drawing
3. Pan and zoom
4. Simple save/load

**Phase 2: Essential Features**
1. Border and road modes
2. Place markers
3. Undo/redo
4. Region fill

**Phase 3: Polish**
1. Brush mode with proper merging
2. Geography icons
3. Fantasy road styling
4. Border-defined regions

**Phase 4: Advanced**
1. Image export
2. Templates/presets
3. Advanced styling
4. Collaboration features (future)

---

## 12. Glossary

- **World Space**: The fixed 2000x1200 coordinate system where map elements are stored
- **Screen Space**: The viewport coordinates in the browser window
- **Barrier Mask**: Binary raster mask indicating fillable vs blocked areas for region fill
- **Chaikin Smoothing**: Corner-cutting subdivision algorithm for smoothing polygons
- **Bathymetry**: Ocean depth visualization rendered as rings around land
- **Flood Fill**: Algorithm to fill contiguous areas with color
- **CSG**: Constructive Solid Geometry - boolean operations on shapes (union, subtract, intersect)
- **Region**: A bounded area defined by borders that can be filled with color (represents kingdoms, districts, etc.)
- **Brush Stroke**: A continuous painting operation from pointerdown to pointerup
- **Polygon Merging**: Combining overlapping or adjacent polygons into a single unified shape
- **Parallel Roads**: Double-line road style with two offset paths drawn parallel to each other
- **Icon/Symbol**: Visual representation of geographical features (mountains, forests, etc.)
- **Convex Hull**: Smallest convex polygon that contains all points in a set
- **Alpha Shape**: Generalization of convex hull that can capture non-convex boundaries

---

## Appendix A: Serialization Format Specification

This is a recommended JSON-based format for saving/loading maps. Implementations may adapt this for other formats (XML, binary, etc.).

### Document Schema

```json
{
  "format": "fantasy-map-sketcher",
  "version": "1.0.0",
  "metadata": {
    "created": "ISO-8601 timestamp",
    "modified": "ISO-8601 timestamp",
    "author": "optional string",
    "title": "optional string",
    "description": "optional string"
  },
  "world": {
    "width": 2000,
    "height": 1200,
    "units": "pixels"
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "scale": 0.75
  },
  "layers": {
    "land": [
      {
        "id": "unique-id",
        "points": [{"x": 100, "y": 200}, ...],
        "properties": {
          "smoothingLevel": 3,
          "name": "optional"
        }
      }
    ],
    "regions": [
      {
        "id": "unique-id",
        "boundaryType": "border-reference" | "explicit-polygon",
        "boundaryRef": "border-id-if-reference",
        "boundaryPoints": [{"x": 100, "y": 200}, ...],  // if explicit
        "fill": {
          "type": "solid" | "pattern" | "gradient",
          "color": {"r": 255, "g": 200, "b": 180, "a": 0.9},
          "pattern": "optional-pattern-ref",
          "opacity": 0.95
        },
        "metadata": {
          "name": "Kingdom of Example",
          "tags": ["kingdom", "coastal"]
        }
      }
    ],
    "borders": [
      {
        "id": "unique-id",
        "points": [{"x": 100, "y": 200}, ...],
        "isClosed": false,
        "style": {
          "width": 2.5,
          "dashPattern": [6, 5],
          "color": {"r": 43, "g": 36, "b": 28, "a": 0.35}
        }
      }
    ],
    "roads": [
      {
        "id": "unique-id",
        "points": [{"x": 100, "y": 200}, ...],
        "style": {
          "type": "major" | "minor" | "trail",
          "renderMode": "double-parallel" | "single",
          "width": 2.0,
          "dashPattern": [],
          "color": {"r": 43, "g": 36, "b": 28, "a": 0.28}
        }
      }
    ],
    "places": [
      {
        "id": "unique-id",
        "type": "city" | "capital" | "town" | "fort" | "port",
        "position": {"x": 500, "y": 600},
        "name": "Luxborough",
        "properties": {
          "population": "optional-metadata",
          "customIcon": "optional-icon-ref"
        }
      }
    ],
    "geography": [
      {
        "id": "unique-id",
        "type": "mountain" | "forest" | "swamp" | "ruin" | "sigil" | "bridge",
        "position": {"x": 800, "y": 400},
        "label": "The Glass Scar",
        "icon": {
          "type": "default" | "custom" | "svg-path",
          "data": "svg-path-data-or-icon-ref",
          "scale": 1.0
        },
        "properties": {
          "customData": "optional"
        }
      }
    ]
  },
  "textures": {
    "regionFill": {
      "format": "png" | "raw-rgba",
      "width": 1000,
      "height": 600,
      "data": "base64-encoded-png or raw-data"
    },
    "grainPattern": {
      "format": "png",
      "data": "base64-encoded-png-optional"
    }
  },
  "customIcons": {
    "icon-id-1": {
      "format": "svg" | "png",
      "data": "svg-path-or-base64-png"
    }
  }
}
```

### Version Migration

When format version changes, implement migration functions:

```
migrateFrom_1_0_to_1_1(oldDocument) -> newDocument
```

### Compression

For large maps, compress JSON using:
- gzip/deflate
- Base64 encode if needed for transport
- Binary formats (MessagePack, CBOR) for efficiency

### Validation

Implement schema validation:
- Check required fields
- Validate data types
- Verify polygon point counts (minimum 3)
- Validate color values (0-255 for RGB, 0-1 for alpha)
- Check world coordinates are within bounds

---

## Appendix B: Color Reference

```css
--ink: #2b241c           /* Primary dark brown */
--ink2: #3b3126          /* Secondary ink */
--paper: #eadbbf         /* Land/parchment */
--paper2: #e3d1ad        /* Alternate paper */
--panel: rgba(25,24,28,.78)   /* UI panels */
--panel2: rgba(35,33,40,.85)  /* Secondary panels */
--line: rgba(255,255,255,.16) /* UI borders */
--text: #f3efe6          /* Primary text */
--muted: rgba(243,239,230,.72) /* Secondary text */
--accent: #a7d0ca        /* Teal accent */
--ocean: #5f7770         /* Ocean background */
```

## Appendix C: Default Icon Definitions

Simple SVG-based icons for geography markers. These should be rendered in ink color (#2b241c).

### Mountain Icon
```svg
<!-- Simple triangle/peak -->
<path d="M 0,-10 L 8,10 L -8,10 Z" />
<!-- For mountain range: multiple peaks -->
<path d="M -12,-8 L -6,10 L -12,10 Z M -6,-12 L 0,10 L -6,10 Z M 0,-10 L 6,10 L 0,10 Z M 6,-8 L 12,10 L 6,10 Z" />
```

### Forest Icon
```svg
<!-- Cluster of circles representing tree canopies -->
<circle cx="-6" cy="0" r="4" />
<circle cx="6" cy="0" r="4" />
<circle cx="0" cy="-6" r="4" />
<circle cx="0" cy="6" r="4" />
<circle cx="0" cy="0" r="5" />
```

### Swamp Icon
```svg
<!-- Wavy grass-like marks -->
<path d="M -8,8 Q -8,0 -8,-8 M -4,8 Q -4,0 -4,-8 M 0,8 Q 0,0 0,-8 M 4,8 Q 4,0 4,-8 M 8,8 Q 8,0 8,-8" stroke-width="1.5" fill="none" />
```

### Ruin Icon
```svg
<!-- Broken square/building -->
<path d="M -8,-8 L 8,-8 L 8,0 L 4,0 M 2,0 L -8,0 Z M -4,-8 L -4,-2" />
```

### Arcane Sigil Icon
```svg
<!-- Circle with star/cross pattern -->
<circle cx="0" cy="0" r="8" fill="none" stroke-width="1.5" />
<path d="M 0,-6 L 0,6 M -6,0 L 6,0 M -4,-4 L 4,4 M -4,4 L 4,-4" stroke-width="1" />
```

### Bridge Icon
```svg
<!-- Two parallel lines with connecting segment -->
<path d="M -10,-4 L 10,-4 M -10,4 L 10,4 M -8,-4 L -8,4 M 0,-4 L 0,4 M 8,-4 L 8,4" stroke-width="1.5" />
```

### Usage Notes
- Scale icons based on zoom level or use fixed screen size
- Render in ink color for consistency
- Add subtle shadow/outline for contrast against land
- Icons should be 16-24px at default zoom
- Consider adding custom icon support for user-provided SVG paths

## Appendix D: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space + Drag | Pan camera |
| Mouse Wheel | Zoom in/out |
| Enter | Finish border/road line |
| Escape | Cancel current operation |
| Delete / Backspace | Delete selected object |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y | Redo |
| Ctrl/Cmd + Shift + Z | Redo (alternate) |

## Appendix E: Default Values

- World size: 2000 x 1200
- Initial zoom: 0.75x
- Initial position: Centered
- Land smoothing: 3 iterations
- Border width: 2.5px
- Border dash: 6,5
- Road width: 2.0px
- Brush size: 30px
- Region resolution: 1000px width
- Zoom range: 0.25x - 4.0x
- Brush size range: 10-100px
