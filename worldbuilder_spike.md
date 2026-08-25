# **Worldbuilder: Custom Image Upload & Zone Editor - Mini Spike**

## **Overview**
Transform the worldbuilder from a pre-populated atlas into a blank canvas where users can upload their own map images and build their world from scratch.

## **Core Features**

### 1. **Clean Slate Start**
- **Current State**: App loads with default Aethelgard world data
- **New State**: App starts with an empty world or a "Create New World" screen
- **Changes Needed**:
  - Add "New World" button to create a fresh map entry
  - Default empty state UI with upload prompt
  - Keep existing import/export functionality for loading pre-made worlds

### 2. **Image Upload System**
- **Feature**: Allow users to upload their own map images
- **Implementation**: Base64 encode images and store directly in WORLD_DATA
  - Works offline immediately
  - Automatically syncs to Google Drive (existing sync handles it)
  - IndexedDB storage (already in use) handles large files easily
  - No extra complexity needed
- **UI Location**:
  - Add "Upload Map Image" button in sidebar tools (next to Export/Import)
  - Per-map basis (each map can have different image)
- **File Handling**:
  - Accept PNG, JPG, WebP formats
  - Client-side resize/compress to reasonable dimensions (max 1920px wide)
  - Convert to base64 data URI
  - Store in map's `image` field (replacing the current Picsum URLs)

### 3. **Text Annotation Layer**
- **Feature**: Add custom text labels directly on the map image
- **New Data Structure**:
  ```javascript
  labels: [
    {
      id: "label-1",
      text: "Dragon Mountains",
      x: 450,        // SVG coordinate
      y: 200,
      fontSize: 24,  // or preset sizes: small/medium/large
      color: "#d4af37", // gold
      rotation: 0    // optional text rotation
    }
  ]
  ```
- **UI/UX**:
  - Add "Add Text" mode toggle (similar to EDIT toggle)
  - Click map to place text, opens quick dialog for text entry
  - Text renders as SVG `<text>` elements in the overlay
  - Edit mode: click existing text to edit/move/delete
  - Drag text labels to reposition

### 4. **Zone Drawing Tool**
- **Current State**: Zones use hardcoded polygon points
- **New Feature**: Interactive zone creation
- **Drawing Modes**:
  - **Rectangle**: Click-drag to define bounds
  - **Polygon**: Click to place points, double-click to close
  - **Freehand**: Draw shape with mouse (convert to polygon points)
- **UI Flow**:
  1. Enter EDIT mode
  2. Click "Add New Zone" → activates drawing mode
  3. Draw zone boundary on map
  4. Auto-generates `points` attribute for SVG polygon
  5. Opens edit panel to add name, description, shops, NPCs, hooks
  6. Optionally link zone to another map ID for navigation
- **Visual Feedback**:
  - Show drawing guides (dotted lines, vertex handles)
  - Highlight zone while drawing
  - Show vertex points for editing existing zones

## **Technical Architecture**

### **Modified Data Structure**
```javascript
const WORLD_DATA = {
  "world": {
    title: "My Custom World",
    image: "data:image/png;base64,...",  // Base64 encoded
    zones: [
      // existing zone structure
    ],
    labels: [  // NEW
      { id: "label-1", text: "The North", x: 200, y: 100, fontSize: 20, color: "#fff" }
    ],
    pins: [
      // existing pin structure
    ]
  }
};
```

### **New UI Components**
1. **Image Upload Button** (sidebar tools)
2. **Text Mode Toggle** (top nav, next to EDIT toggle)
3. **Drawing Mode Toolbar** (appears when adding new zone)
   - Rectangle tool
   - Polygon tool
   - Selection/move tool
4. **Text Edit Dialog** (small modal for quick text entry)

### **Updated SVG Overlay Rendering**
- Add `<text>` layer for labels (rendered after zones, before pins)
- Add drawing guides layer for zone creation mode
- Add vertex handles for zone editing

## **User Workflow**

### **Creating a New World**
1. Click "New World" or start with empty default
2. Click "Upload Map Image" → select file
3. Image loads into map view
4. Click "Add Text" → click map → type label → place
5. Click "EDIT" → "Add New Zone" → draw zone boundary
6. Fill in zone details (name, lore, etc.)
7. Optionally create linked map by setting `target` field
8. Repeat for additional zones/labels
9. Export to JSON or sync to Google Drive

### **Editing Existing Zones**
1. Toggle "EDIT" mode
2. Click zone to edit
3. Edit panel shows zone details
4. **NEW**: Show "Edit Boundary" button → activates vertex editing
5. Drag vertices to reshape zone
6. Save changes

## **Implementation Phases**

### **Phase 1: Image Upload** (Foundation)
- Add image upload button
- File input handler with base64 conversion
- Update map data structure to store custom images
- Test with LocalStore and Google Drive sync

### **Phase 2: Text Annotations** (Quick Win)
- Add `labels` array to data structure
- Render labels as SVG text elements
- Add "Text Mode" with click-to-place functionality
- Text edit dialog (simple prompt or mini-form)
- Drag-to-move text labels

### **Phase 3: Zone Drawing** (Complex)
- Polygon drawing mode (click-to-place vertices)
- Convert drawn shape to polygon points
- Visual feedback during drawing
- Vertex editing for existing zones
- Rectangle quick-draw option

### **Phase 4: Polish**
- Improve drawing tools (snapping, guides, undo)
- Text styling options (font size presets, color picker)
- Zone color/opacity customization
- Better mobile support for drawing

## **Design Decisions to Make**
1. **Drawing Complexity**: Start with simple polygon-only, or add rectangle tool from the start?
   - **Recommendation**: Polygon-only for MVP, add rectangle later if needed
2. **Text Styling**: Fixed style (current aesthetic) or user-customizable fonts/colors?
   - **Recommendation**: Start with 2-3 preset sizes, single color (gold). Add customization later if requested
3. **Multi-Select**: Should users be able to select and move multiple labels/zones at once?
   - **Recommendation**: No. Keep it simple - one at a time

## **Risks & Considerations**
- **Mobile UX**: Drawing polygons on touch devices is tricky
  - Mitigation: Test on mobile, consider touch-optimized controls or rectangle-only mode
- **Complexity Creep**: Easy to over-engineer the drawing tools
  - Mitigation: Start with barebones polygon drawing, iterate based on actual use

## **Why This Works**
- **Existing architecture handles it**: Your IndexedDB + Drive sync already supports large data
- **Simple mental model**: Upload image → draw zones → add text → export/sync
- **No new dependencies**: Pure vanilla JS, uses existing storage layer
- **Works offline**: Base64 + IndexedDB = full offline capability

---

**Next Steps**: Implement Phase 1 (image upload) → Phase 2 (text labels) → Phase 3 (zone drawing). Each phase is independently useful.
