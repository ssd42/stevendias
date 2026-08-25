(() => {
  const baseCanvas = document.getElementById("baseCanvas");
  const overlayCanvas = document.getElementById("overlayCanvas");
  const wrap = document.getElementById("canvasWrap");

  const sizeSlider = document.getElementById("sizeSlider");
  const sizeValue = document.getElementById("sizeValue");

  const undoBtn = document.getElementById("undoBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");

  const statusTool = document.getElementById("statusTool");

  const baseCtx = baseCanvas.getContext("2d");
  const overlayCtx = overlayCanvas.getContext("2d");

  const TOOL = {
    LAND: "land",
    WATER: "water",
    OCEAN: "ocean",
    ROAD: "road",
    ICON_CITY: "icon_city",
    ICON_MOUNTAIN: "icon_mountain",
    ICON_FOREST: "icon_forest",
    ICON_CASTLE: "icon_castle",
    ICON_RUINS: "icon_ruins",
  };

  const ICON_TYPES = new Set([
    TOOL.ICON_CITY,
    TOOL.ICON_MOUNTAIN,
    TOOL.ICON_FOREST,
    TOOL.ICON_CASTLE,
    TOOL.ICON_RUINS,
  ]);

  // SVG Icon definitions (fantasy map style)
  const ICON_SVGS = {
    [TOOL.ICON_CITY]: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#3d2f24" opacity="0.12"/>
      <path d="M 25,70 L 25,40 L 35,35 L 35,70 Z M 40,70 L 40,30 L 50,25 L 60,30 L 60,70 Z M 65,70 L 65,45 L 75,40 L 75,70 Z" fill="none" stroke="#3d2f24" stroke-width="3" stroke-linejoin="miter"/>
      <line x1="20" y1="72" x2="80" y2="72" stroke="#3d2f24" stroke-width="3"/>
    </svg>`,

    [TOOL.ICON_MOUNTAIN]: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#3d2f24" opacity="0.12"/>
      <path d="M 20,75 L 40,30 L 55,75 Z" fill="none" stroke="#3d2f24" stroke-width="3.5" stroke-linejoin="miter"/>
      <path d="M 45,75 L 60,40 L 80,75 Z" fill="none" stroke="#3d2f24" stroke-width="3.5" stroke-linejoin="miter"/>
      <path d="M 35,50 L 40,30 L 45,50" fill="none" stroke="#6b5d52" stroke-width="2"/>
    </svg>`,

    [TOOL.ICON_FOREST]: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#3d2f24" opacity="0.12"/>
      <path d="M 30,70 L 30,45 L 35,35 L 40,45 L 40,70" fill="none" stroke="#3d2f24" stroke-width="2.5"/>
      <path d="M 47,70 L 47,40 L 53,28 L 59,40 L 59,70" fill="none" stroke="#3d2f24" stroke-width="2.5"/>
      <path d="M 64,70 L 64,48 L 69,38 L 74,48 L 74,70" fill="none" stroke="#3d2f24" stroke-width="2.5"/>
      <circle cx="35" cy="37" r="6" fill="none" stroke="#3d2f24" stroke-width="2"/>
      <circle cx="53" cy="30" r="7" fill="none" stroke="#3d2f24" stroke-width="2"/>
      <circle cx="69" cy="40" r="6" fill="none" stroke="#3d2f24" stroke-width="2"/>
    </svg>`,

    [TOOL.ICON_CASTLE]: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#3d2f24" opacity="0.12"/>
      <rect x="30" y="45" width="40" height="30" fill="none" stroke="#3d2f24" stroke-width="3"/>
      <rect x="22" y="30" width="12" height="15" fill="none" stroke="#3d2f24" stroke-width="3"/>
      <rect x="66" y="30" width="12" height="15" fill="none" stroke="#3d2f24" stroke-width="3"/>
      <rect x="44" y="55" width="12" height="20" fill="none" stroke="#3d2f24" stroke-width="2.5"/>
      <line x1="30" y1="50" x2="30" y2="75" stroke="#3d2f24" stroke-width="3"/>
      <line x1="70" y1="50" x2="70" y2="75" stroke="#3d2f24" stroke-width="3"/>
    </svg>`,

    [TOOL.ICON_RUINS]: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#3d2f24" opacity="0.12"/>
      <path d="M 25,75 L 30,35 L 35,75" fill="none" stroke="#3d2f24" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M 42,75 L 42,55 L 48,45 L 53,55" fill="none" stroke="#3d2f24" stroke-width="3" stroke-linecap="round"/>
      <rect x="60" y="55" width="15" height="20" fill="none" stroke="#3d2f24" stroke-width="3"/>
      <line x1="28" y1="50" x2="33" y2="50" stroke="#6b5d52" stroke-width="2"/>
    </svg>`,
  };

  // Load SVG icons as images
  const iconImages = {};
  function loadIconImages() {
    Object.keys(ICON_SVGS).forEach(type => {
      const img = new Image();
      const svg = ICON_SVGS[type];
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      img.src = url;
      iconImages[type] = img;
    });
  }
  loadIconImages();

  const COLORS = {
    // Fantasy parchment palette
    parchment: "#e8d7b8",           // base parchment
    parchmentDark: "#d4c4a8",       // darker parchment regions

    // SOLID fills for regions (no transparency)
    landFill: "#d4c4a8",            // solid tan land
    waterFill: "#b8c8d8",           // solid pale blue water
    oceanFill: "#8fa8bc",           // solid darker blue ocean

    // Borders for regions
    landBorder: "#6b5d52",          // dark tan
    waterBorder: "#5a7a8f",         // darker blue
    oceanBorder: "#3d5568",         // darkest blue

    // Ink colors for details
    inkBrown: "#3d2f24",            // primary drawing color
    inkLight: "#6b5d52",            // lighter details

    // Road color
    roadTan: "#a89880",
  };

  const state = {
    tool: TOOL.LAND,
    brushSize: Number(sizeSlider.value),
    isPointerDown: false,

    // Terrain regions (polygons with solid fill + border)
    terrainRegions: [], // { type: TOOL.WATER/OCEAN/LAND, points: [{x,y}] }
    currentPolygon: null, // { type, points: [] }

    // Icons and roads (retained)
    icons: [], // { type, x, y, size }
    roads: [], // { points:[{x,y}], width }

    // Road drafting
    roadDraft: null, // { points:[], width }

    // Undo stack
    undoStack: [],
    _previewPoint: null,
  };

  function setActiveTool(tool) {
    state.tool = tool;

    document.querySelectorAll(".toolbtn").forEach((btn) => {
      const isActive = btn.dataset.tool === tool;
      btn.classList.toggle("active", isActive);
    });

    updateStatus();
    redrawOverlay();
  }

  function updateStatus() {
    const label = {
      [TOOL.LAND]: "Shade",
      [TOOL.WATER]: "Water",
      [TOOL.OCEAN]: "Depths",
      [TOOL.ROAD]: "Road",
      [TOOL.ICON_CITY]: "City",
      [TOOL.ICON_MOUNTAIN]: "Peak",
      [TOOL.ICON_FOREST]: "Woods",
      [TOOL.ICON_CASTLE]: "Keep",
      [TOOL.ICON_RUINS]: "Ruins",
    }[state.tool] || state.tool;

    statusTool.textContent = label;
    sizeValue.textContent = String(Math.round(state.brushSize));
  }

  function resizeCanvasesToWrap() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    baseCanvas.width = w;
    baseCanvas.height = h;
    overlayCanvas.width = w;
    overlayCanvas.height = h;

    // Redraw everything from stored data
    redrawBase();
    redrawOverlay();
  }

  function initLandBackground() {
    baseCtx.save();

    // Base parchment color
    baseCtx.fillStyle = COLORS.parchment;
    baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

    // Add subtle texture/grain
    addParchmentTexture(baseCtx);

    baseCtx.restore();
  }

  function addParchmentTexture(ctx) {
    // Create organic parchment texture using noise
    const imageData = ctx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Add random variation to create paper grain
      const noise = (Math.random() - 0.5) * 20;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }

    ctx.putImageData(imageData, 0, 0);

    // Add some subtle darker stains/variations
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * baseCanvas.width;
      const y = Math.random() * baseCanvas.height;
      const radius = 80 + Math.random() * 150;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(212, 196, 168, ${0.05 + Math.random() * 0.1})`);
      gradient.addColorStop(1, "rgba(212, 196, 168, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
    }
  }

  function getCanvasPoint(e) {
    const rect = overlayCanvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    return { x, y };
  }

  // ---------- Terrain Polygon Drawing ----------
  function getRegionColors(terrainType) {
    if (terrainType === TOOL.WATER) {
      return { fill: COLORS.waterFill, border: COLORS.waterBorder };
    }
    if (terrainType === TOOL.OCEAN) {
      return { fill: COLORS.oceanFill, border: COLORS.oceanBorder };
    }
    // LAND
    return { fill: COLORS.landFill, border: COLORS.landBorder };
  }

  function startPolygon(type, point) {
    state.currentPolygon = { type, points: [point] };
    redrawOverlay();
  }

  function addPolygonPoint(point) {
    if (!state.currentPolygon) return;
    state.currentPolygon.points.push(point);
    redrawOverlay();
  }

  function finishPolygon() {
    if (!state.currentPolygon || state.currentPolygon.points.length < 3) {
      cancelPolygon();
      return;
    }

    // Add completed polygon to terrain regions
    state.terrainRegions.push({
      type: state.currentPolygon.type,
      points: [...state.currentPolygon.points],
    });

    state.undoStack.push({ type: "terrain" });
    state.currentPolygon = null;
    redrawBase();
    redrawOverlay();
  }

  function cancelPolygon() {
    state.currentPolygon = null;
    redrawOverlay();
  }

  function redrawBase() {
    // Redraw parchment background
    initLandBackground();

    // Draw all terrain regions on base canvas
    for (const region of state.terrainRegions) {
      drawTerrainRegion(baseCtx, region, false);
    }
  }

  function drawTerrainRegion(ctx, region, isDraft) {
    if (region.points.length < 2) return;

    const { fill, border } = getRegionColors(region.type);

    ctx.save();

    // Fill the polygon
    ctx.fillStyle = fill;
    ctx.globalAlpha = isDraft ? 0.6 : 1.0;
    ctx.beginPath();
    ctx.moveTo(region.points[0].x, region.points[0].y);
    for (let i = 1; i < region.points.length; i++) {
      ctx.lineTo(region.points[i].x, region.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Stroke the border
    ctx.strokeStyle = border;
    ctx.lineWidth = isDraft ? 2 : 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalAlpha = isDraft ? 0.7 : 0.85;
    ctx.stroke();

    ctx.restore();
  }

  // ---------- Icons ----------
  function addIcon(type, point) {
    const size = clamp(state.brushSize, 10, 80);
    state.icons.push({ type, x: point.x, y: point.y, size });
    state.undoStack.push({ type: "icon" });
    redrawOverlay();
  }

  function drawIcon(ctx, icon) {
    const { x, y, size, type } = icon;

    const img = iconImages[type];
    if (!img || !img.complete) return; // Skip if image not loaded yet

    ctx.save();

    // Draw the SVG icon centered at position
    const iconSize = size * 1.2; // Scale up a bit
    ctx.drawImage(img, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);

    ctx.restore();
  }

  // ---------- Roads ----------
  function startOrAddRoadPoint(point) {
    if (!state.roadDraft) {
      state.roadDraft = { points: [point], width: clamp(state.brushSize * 0.12, 2, 12) };
      redrawOverlay();
      return;
    }
    state.roadDraft.points.push(point);
    redrawOverlay();
  }

  function finishRoad() {
    if (!state.roadDraft) return;
    if (state.roadDraft.points.length < 2) {
      state.roadDraft = null;
      redrawOverlay();
      return;
    }

    state.roads.push({
      points: [...state.roadDraft.points],
      width: state.roadDraft.width,
    });

    state.undoStack.push({ type: "road" });
    state.roadDraft = null;
    redrawOverlay();
  }

  function cancelRoad() {
    state.roadDraft = null;
    redrawOverlay();
  }

  function drawRoadPath(ctx, points, width, isDraft) {
    if (points.length < 2) return;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Darker outline for roads
    ctx.strokeStyle = COLORS.inkBrown;
    ctx.lineWidth = width + 2;
    ctx.globalAlpha = isDraft ? 0.4 : 0.6;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    // Road center line
    ctx.strokeStyle = isDraft ? COLORS.parchmentDark : COLORS.roadTan;
    ctx.lineWidth = width;
    ctx.globalAlpha = isDraft ? 0.6 : 0.85;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    ctx.restore();
  }

  function drawRoads(ctx) {
    for (const road of state.roads) drawRoadPath(ctx, road.points, road.width, false);
    if (state.roadDraft) drawRoadPath(ctx, state.roadDraft.points, state.roadDraft.width, true);
  }

  // ---------- Overlay redraw ----------
  function redrawOverlay() {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw current polygon being drafted
    if (state.currentPolygon) {
      drawTerrainRegion(overlayCtx, state.currentPolygon, true);
    }

    drawRoads(overlayCtx);

    for (const icon of state.icons) drawIcon(overlayCtx, icon);

    drawPreview(overlayCtx);
  }

  function drawPreview(ctx) {
    const p = state._previewPoint;
    if (!p) return;

    const isTerrain = state.tool === TOOL.LAND || state.tool === TOOL.WATER || state.tool === TOOL.OCEAN;
    const isRoad = state.tool === TOOL.ROAD;
    const isIcon = ICON_TYPES.has(state.tool);

    ctx.save();

    // Terrain polygon: show vertex dots and preview line
    if (isTerrain) {
      // Draw dots at existing vertices
      if (state.currentPolygon) {
        ctx.fillStyle = COLORS.inkBrown;
        for (const point of state.currentPolygon.points) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw line from last point to cursor
        const lastPoint = state.currentPolygon.points[state.currentPolygon.points.length - 1];
        ctx.strokeStyle = COLORS.inkLight;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Show cursor dot
      ctx.fillStyle = COLORS.inkLight;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isRoad) {
      ctx.strokeStyle = COLORS.inkBrown;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isIcon) {
      const size = clamp(state.brushSize, 10, 80);

      // Show preview of the icon
      const img = iconImages[state.tool];
      if (img && img.complete) {
        ctx.globalAlpha = 0.5;
        const iconSize = size * 1.2;
        ctx.drawImage(img, p.x - iconSize / 2, p.y - iconSize / 2, iconSize, iconSize);
        ctx.globalAlpha = 1.0;
      }

      // Show size circle
      ctx.strokeStyle = COLORS.inkLight;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ---------- Undo / Clear / Export ----------
  function undo() {
    const action = state.undoStack.pop();
    if (!action) return;

    if (action.type === "terrain") {
      state.terrainRegions.pop();
      redrawBase();
      redrawOverlay();
      return;
    }

    if (action.type === "icon") {
      state.icons.pop();
      redrawOverlay();
      return;
    }

    if (action.type === "road") {
      state.roads.pop();
      redrawOverlay();
      return;
    }
  }

  function clearAll() {
    state.terrainRegions = [];
    state.currentPolygon = null;
    state.icons = [];
    state.roads = [];
    state.roadDraft = null;
    state.undoStack = [];
    initLandBackground();
    redrawOverlay();
  }

  function exportPNG() {
    const out = document.createElement("canvas");
    out.width = baseCanvas.width;
    out.height = baseCanvas.height;
    const outCtx = out.getContext("2d");

    outCtx.drawImage(baseCanvas, 0, 0);
    outCtx.drawImage(overlayCanvas, 0, 0);

    const url = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "fantasy-map.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------- Input handling ----------
  function onPointerDown(e) {
    e.preventDefault();
    overlayCanvas.setPointerCapture(e.pointerId);

    state.isPointerDown = true;
    const p = getCanvasPoint(e);

    // Terrain tools: polygon drawing
    if (state.tool === TOOL.LAND || state.tool === TOOL.WATER || state.tool === TOOL.OCEAN) {
      if (!state.currentPolygon) {
        startPolygon(state.tool, p);
      } else {
        addPolygonPoint(p);
      }
      return;
    }

    if (ICON_TYPES.has(state.tool)) {
      addIcon(state.tool, p);
      return;
    }

    if (state.tool === TOOL.ROAD) {
      startOrAddRoadPoint(p);
      return;
    }
  }

  function onPointerMove(e) {
    const p = getCanvasPoint(e);
    state._previewPoint = p;

    redrawOverlay();
  }

  function onPointerUp(e) {
    e.preventDefault();
    state.isPointerDown = false;
  }

  function onDoubleClick(e) {
    e.preventDefault();

    // Finish terrain polygon
    if (state.tool === TOOL.LAND || state.tool === TOOL.WATER || state.tool === TOOL.OCEAN) {
      finishPolygon();
      return;
    }

    // Finish road
    if (state.tool === TOOL.ROAD) {
      finishRoad();
      return;
    }
  }

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
      return;
    }

    // Terrain polygon controls
    if (state.tool === TOOL.LAND || state.tool === TOOL.WATER || state.tool === TOOL.OCEAN) {
      if (e.key === "Enter") {
        e.preventDefault();
        finishPolygon();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelPolygon();
        return;
      }
    }

    // Road controls
    if (state.tool === TOOL.ROAD) {
      if (e.key === "Enter") {
        e.preventDefault();
        finishRoad();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelRoad();
        return;
      }
    }
  }

  // ---------- UI wiring ----------
  document.querySelectorAll(".toolbtn").forEach((btn) => {
    btn.addEventListener("click", () => setActiveTool(btn.dataset.tool));
  });

  sizeSlider.addEventListener("input", () => {
    state.brushSize = Number(sizeSlider.value);
    updateStatus();

    if (state.tool === TOOL.ROAD && state.roadDraft) {
      state.roadDraft.width = clamp(state.brushSize * 0.12, 2, 12);
      redrawOverlay();
    }
  });

  undoBtn.addEventListener("click", undo);
  clearBtn.addEventListener("click", clearAll);
  exportBtn.addEventListener("click", exportPNG);

  overlayCanvas.addEventListener("pointerdown", onPointerDown);
  overlayCanvas.addEventListener("pointermove", onPointerMove);
  overlayCanvas.addEventListener("pointerup", onPointerUp);
  overlayCanvas.addEventListener("pointercancel", onPointerUp);
  overlayCanvas.addEventListener("dblclick", onDoubleClick);
  window.addEventListener("keydown", onKeyDown);

  window.addEventListener("resize", resizeCanvasesToWrap);

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  // ---------- Init ----------
  setActiveTool(TOOL.LAND);
  resizeCanvasesToWrap();
  updateStatus();
  redrawOverlay();
})();
