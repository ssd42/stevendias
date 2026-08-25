(() => {
  // =========================
  // World + Canvas setup
  // =========================
  const WORLD_W = 2000;
  const WORLD_H = 1200;

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
  function parseNum(s, fallback){
    const v = Number(String(s).trim());
    return Number.isFinite(v) ? v : fallback;
  }
  function deepClone(o){ return JSON.parse(JSON.stringify(o)); }
  function id(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  const view = { x: 0, y: 0, scale: 0.75 };

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  window.addEventListener('resize', resize);

  function worldToScreen(p){
    return { x: p.x * view.scale + view.x, y: p.y * view.scale + view.y };
  }
  function screenToWorld(p){
    return { x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale };
  }

  // =========================
  // Data model
  // =========================
  const state = {
    land: [],    // {id, points:[{x,y}], name?}
    borders: [], // {id, kind:'border', points:[{x,y}], width, dash}
    roads: [],   // {id, kind:'road', points:[{x,y}], width, dash}
    places: []   // {id, kind:'place'|'geo', type, name/label, x,y}
  };

  // Region fill is a raster texture in world space.
  // We keep a fixed-resolution offscreen image that aligns to WORLD coords.
  const REG_W = 1000; // decent quality without being huge
  const REG_H = Math.round(REG_W * (WORLD_H / WORLD_W));

  const regionCanvas = document.createElement('canvas');
  regionCanvas.width = REG_W;
  regionCanvas.height = REG_H;
  const rctx = regionCanvas.getContext('2d', { willReadFrequently: true });

  // Barrier mask: 0 = outside land or wall, 1 = fillable interior.
  // We rebuild when land/borders change.
  let barrier = null; // Uint8Array(REG_W*REG_H)

  // =========================
  // History
  // =========================
  const history = { past: [], future: [] };

  function snapshot(){
    // include region pixels too
    const regionPNG = regionCanvas.toDataURL('image/png');
    return { state: deepClone(state), view: deepClone(view), regionPNG };
  }
  function restore(snap){
    Object.assign(state, snap.state);
    Object.assign(view, snap.view);
    loadRegionPNG(snap.regionPNG).then(() => {
      rebuildBarrier();
      clearInteraction();
      draw();
    });
  }
  function pushHistory(){
    history.past.push(snapshot());
    history.future = [];
    updateUndoRedo();
  }
  function undo(){
    if (!history.past.length) return;
    history.future.push(snapshot());
    const prev = history.past.pop();
    updateUndoRedo();
    restore(prev);
  }
  function redo(){
    if (!history.future.length) return;
    history.past.push(snapshot());
    const next = history.future.pop();
    updateUndoRedo();
    restore(next);
  }

  function updateUndoRedo(){
    undoBtn.style.opacity = history.past.length ? "1" : "0.45";
    redoBtn.style.opacity = history.future.length ? "1" : "0.45";
  }

  // =========================
  // UI wiring
  // =========================
  const modeLabel = document.getElementById('modeLabel');
  const layerLabel = document.getElementById('layerLabel');
  const modeButtons = document.getElementById('modeButtons');
  const layerButtons = document.getElementById('layerButtons');

  const landOpts = document.getElementById('landOpts');
  const brushOpts = document.getElementById('brushOpts');
  const regionOpts = document.getElementById('regionOpts');
  const lineOpts = document.getElementById('lineOpts');
  const placeOpts = document.getElementById('placeOpts');
  const geoOpts = document.getElementById('geoOpts');
  const selectOpts = document.getElementById('selectOpts');

  const landSmooth = document.getElementById('landSmooth');
  const brushAddBtn = document.getElementById('brushAddBtn');
  const brushDeleteBtn = document.getElementById('brushDeleteBtn');
  const brushSize = document.getElementById('brushSize');
  const brushSizeLabel = document.getElementById('brushSizeLabel');
  const lineWidth = document.getElementById('lineWidth');
  const lineDash = document.getElementById('lineDash');

  const placeType = document.getElementById('placeType');
  const placeName = document.getElementById('placeName');
  const geoType = document.getElementById('geoType');
  const geoLabel = document.getElementById('geoLabel');

  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearBtn = document.getElementById('clearBtn');

  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const jsonBox = document.getElementById('jsonBox');
  const jsonErr = document.getElementById('jsonErr');

  const selLabel = document.getElementById('selLabel');
  const selName = document.getElementById('selName');
  const applySelBtn = document.getElementById('applySelBtn');
  const deleteSelBtn = document.getElementById('deleteSelBtn');

  const swatchesEl = document.getElementById('swatches');
  const randColorBtn = document.getElementById('randColorBtn');
  const rebuildMaskBtn = document.getElementById('rebuildMaskBtn');

  let mode = "land";  // land|brush|region|border|road|place|geo|select
  let layer = "all";  // all|land|regions|borders|roads|places
  let brushMode = "add"; // add|delete
  let brushRadius = 30;

  function setMode(m){
    mode = m;
    modeLabel.textContent = ({
      land:"Land",
      brush:"Brush",
      region:"Region Fill",
      border:"Borders",
      road:"Roads",
      place:"Cities",
      geo:"Geography",
      select:"Select"
    })[m] || m;

    landOpts.style.display = (m==="land") ? "block" : "none";
    brushOpts.style.display = (m==="brush") ? "block" : "none";
    regionOpts.style.display = (m==="region") ? "block" : "none";
    lineOpts.style.display = (m==="border" || m==="road") ? "block" : "none";
    placeOpts.style.display = (m==="place") ? "block" : "none";
    geoOpts.style.display = (m==="geo") ? "block" : "none";
    selectOpts.style.display = (m==="select") ? "block" : "none";

    clearInProgress();
    draw();
  }
  function setLayer(l){
    layer = l;
    layerLabel.textContent = ({
      all:"All",
      land:"Land",
      regions:"Regions",
      borders:"Borders",
      roads:"Roads",
      places:"Places"
    })[l] || l;
    draw();
  }

  modeButtons.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn'); if(!btn) return;
    [...modeButtons.querySelectorAll('.btn')].forEach(b => b.classList.toggle('active', b===btn));
    setMode(btn.dataset.mode);
  });
  layerButtons.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn'); if(!btn) return;
    [...layerButtons.querySelectorAll('.btn')].forEach(b => b.classList.toggle('active', b===btn));
    setLayer(btn.dataset.layer);
  });

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  clearBtn.addEventListener('click', ()=>{
    pushHistory();
    state.land = [];
    state.borders = [];
    state.roads = [];
    state.places = [];
    // clear regions
    rctx.clearRect(0,0,REG_W,REG_H);
    rebuildBarrier();
    clearInteraction();
    draw();
  });

  exportBtn.addEventListener('click', ()=>{
    jsonErr.style.display = "none";
    const payload = {
      version: 1,
      world: { w: WORLD_W, h: WORLD_H },
      view,
      state,
      regionPNG: regionCanvas.toDataURL('image/png')
    };
    jsonBox.value = JSON.stringify(payload, null, 2);
    jsonBox.focus(); jsonBox.select();
  });

  importBtn.addEventListener('click', async ()=>{
    jsonErr.style.display = "none";
    try{
      const payload = JSON.parse(jsonBox.value || "{}");
      if (!payload || payload.version !== 1) throw new Error("Bad JSON format (expected version:1)");
      pushHistory();
      Object.assign(view, payload.view || view);
      Object.assign(state, payload.state || state);
      await loadRegionPNG(payload.regionPNG || "");
      rebuildBarrier();
      clearInteraction();
      draw();
    }catch(err){
      jsonErr.textContent = String(err?.message || err);
      jsonErr.style.display = "block";
    }
  });

  applySelBtn.addEventListener('click', ()=>{
    if (!selected) return;
    const v = selName.value.trim();
    pushHistory();
    if (selected.type === "place"){
      const p = state.places.find(x => x.id === selected.id);
      if (!p) return;
      if (p.kind === "place") p.name = v;
      if (p.kind === "geo") p.label = v;
    }
    draw();
    updateSelectionUI();
  });

  deleteSelBtn.addEventListener('click', ()=>{
    if (!selected) return;
    pushHistory();
    deleteSelected();
    draw();
  });

  rebuildMaskBtn.addEventListener('click', ()=>{
    rebuildBarrier();
    draw();
  });

  // Brush controls
  brushAddBtn.addEventListener('click', ()=>{
    brushMode = "add";
    brushAddBtn.classList.add('active');
    brushDeleteBtn.classList.remove('active');
  });

  brushDeleteBtn.addEventListener('click', ()=>{
    brushMode = "delete";
    brushDeleteBtn.classList.add('active');
    brushAddBtn.classList.remove('active');
  });

  brushSize.addEventListener('input', ()=>{
    brushRadius = parseFloat(brushSize.value);
    brushSizeLabel.textContent = brushRadius;
    draw();
  });

  // =========================
  // Swatches (pastel region palette)
  // =========================
  const PALETTE = [
    "#f2c6bf", "#dfe7a7", "#c7e6de", "#d7c7ea", "#f0d3a9", "#cfe0f0",
    "#f3d0e5", "#cfe8c7", "#ead9b6", "#d8e6f5", "#f5e2b8", "#d5d1f2"
  ];
  let currentRegionColor = PALETTE[0];

  function renderSwatches(){
    swatchesEl.innerHTML = "";
    PALETTE.forEach(c => {
      const d = document.createElement('div');
      d.className = "swatch" + (c === currentRegionColor ? " selected" : "");
      d.style.background = c;
      d.title = c;
      d.addEventListener('click', ()=>{
        currentRegionColor = c;
        renderSwatches();
      });
      swatchesEl.appendChild(d);
    });
  }
  function randomPastel(){
    // nudge random to pastel-ish
    const r = 180 + Math.random()*60;
    const g = 180 + Math.random()*60;
    const b = 180 + Math.random()*60;
    return `rgb(${r|0},${g|0},${b|0})`;
  }
  randColorBtn.addEventListener('click', ()=>{
    currentRegionColor = randomPastel();
    renderSwatches();
  });

  // =========================
  // Interaction state
  // =========================
  let spaceDown = false;
  let isPointerDown = false;
  let isPanning = false;
  let panStart = null;

  // In-progress
  let currentLandStroke = null; // freehand points
  let currentLine = null;       // border/road points
  let currentBrushStroke = null; // brush stroke points
  let hover = null;             // world point
  let selected = null;          // {type:'land'|'line'|'place', id}

  function clearInProgress(){
    currentLandStroke = null;
    currentLine = null;
    currentBrushStroke = null;
    hover = null;
  }
  function clearInteraction(){
    clearInProgress();
    selected = null;
    updateSelectionUI();
  }

  // =========================
  // Fantasy textures (paper grain)
  // =========================
  const grainPattern = (() => {
    const g = document.createElement('canvas');
    g.width = 280; g.height = 280;
    const gctx = g.getContext('2d');
    gctx.fillStyle = "rgba(0,0,0,0)";
    gctx.fillRect(0,0,g.width,g.height);

    // base subtle noise
    const img = gctx.createImageData(g.width, g.height);
    for (let i=0; i<img.data.length; i+=4){
      const v = 200 + (Math.random()*40 - 20);
      img.data[i] = v;
      img.data[i+1] = v;
      img.data[i+2] = v;
      img.data[i+3] = 18; // very subtle
    }
    gctx.putImageData(img,0,0);

    // a few "fiber" streaks
    gctx.globalAlpha = 0.10;
    gctx.strokeStyle = "#000";
    for (let i=0;i<120;i++){
      const x = Math.random()*g.width;
      const y = Math.random()*g.height;
      gctx.lineWidth = 1;
      gctx.beginPath();
      gctx.moveTo(x,y);
      gctx.lineTo(x + (Math.random()*80-40), y + (Math.random()*12-6));
      gctx.stroke();
    }
    gctx.globalAlpha = 1;

    return ctx.createPattern(g, 'repeat');
  })();

  // =========================
  // Geometry helpers
  // =========================
  function simplify(points, minDist){
    if (points.length <= 2) return points;
    const md2 = minDist*minDist;
    const out = [points[0]];
    let last = points[0];
    for (let i=1;i<points.length;i++){
      const dx = points[i].x - last.x;
      const dy = points[i].y - last.y;
      if (dx*dx + dy*dy >= md2){
        out.push(points[i]);
        last = points[i];
      }
    }
    if (out.length < 3) return points;
    return out;
  }

  // Chaikin smoothing for coastlines
  function chaikin(points, iterations){
    let pts = points.slice();
    for (let k=0; k<iterations; k++){
      const res = [];
      for (let i=0; i<pts.length; i++){
        const p0 = pts[i];
        const p1 = pts[(i+1) % pts.length];
        const q = { x: 0.75*p0.x + 0.25*p1.x, y: 0.75*p0.y + 0.25*p1.y };
        const r = { x: 0.25*p0.x + 0.75*p1.x, y: 0.25*p0.y + 0.75*p1.y };
        res.push(q,r);
      }
      pts = res;
    }
    return pts;
  }

  function pointsToPath(points){
    const p = new Path2D();
    if (!points.length) return p;
    p.moveTo(points[0].x, points[0].y);
    for (let i=1;i<points.length;i++) p.lineTo(points[i].x, points[i].y);
    p.closePath();
    return p;
  }

  function pointToSegDist(p, a, b){
    const abx = b.x - a.x, aby = b.y - a.y;
    const apx = p.x - a.x, apy = p.y - a.y;
    const ab2 = abx*abx + aby*aby;
    const t = ab2 === 0 ? 0 : clamp((apx*abx + apy*aby)/ab2, 0, 1);
    const cx = a.x + t*abx, cy = a.y + t*aby;
    const dx = p.x - cx, dy = p.y - cy;
    return Math.sqrt(dx*dx + dy*dy);
  }

  // =========================
  // Hit testing
  // =========================
  function hitPlace(world, maxPx=14){
    const tol = maxPx / view.scale;
    let best = null, bestD = Infinity;
    for (const p of state.places){
      const dx = world.x - p.x, dy = world.y - p.y;
      const d2 = dx*dx + dy*dy;
      if (d2 <= tol*tol && d2 < bestD){
        best = p; bestD = d2;
      }
    }
    return best;
  }

  function hitLine(world, lines, maxPx=10){
    const tol = maxPx / view.scale;
    let best = null, bestD = Infinity;
    for (const l of lines){
      for (let i=0;i<l.points.length-1;i++){
        const d = pointToSegDist(world, l.points[i], l.points[i+1]);
        if (d <= tol && d < bestD){
          best = l; bestD = d;
        }
      }
    }
    return best;
  }

  function hitLand(world, maxPx=10){
    // quick: see if near any polygon edge
    const tol = maxPx / view.scale;
    let best = null, bestD = Infinity;
    for (const poly of state.land){
      const pts = poly.points;
      for (let i=0;i<pts.length;i++){
        const a = pts[i], b = pts[(i+1)%pts.length];
        const d = pointToSegDist(world, a, b);
        if (d <= tol && d < bestD){
          best = poly; bestD = d;
        }
      }
    }
    return best;
  }

  // =========================
  // Brush helpers
  // =========================
  function createCirclePoints(center, radius, segments = 32){
    const points = [];
    for (let i = 0; i < segments; i++){
      const angle = (i / segments) * Math.PI * 2;
      points.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      });
    }
    return points;
  }

  function applyBrushStroke(brushPoints, isAdd){
    if (!brushPoints || brushPoints.length === 0) return;

    // Create a circle polygon from the last brush position
    const lastPoint = brushPoints[brushPoints.length - 1];
    const circlePoints = createCirclePoints(lastPoint, brushRadius).map(clampWorld);

    if (isAdd){
      // Add land: create a new land polygon
      state.land.push({ id: id(), points: circlePoints });
    } else {
      // Delete land: subtract circle from existing land polygons
      // For simplicity, we'll remove any land polygon that intersects with the brush
      state.land = state.land.filter(poly => {
        // Check if any point of the polygon is inside the brush circle
        for (const pt of poly.points){
          const dx = pt.x - lastPoint.x;
          const dy = pt.y - lastPoint.y;
          if (dx*dx + dy*dy <= brushRadius*brushRadius){
            return false; // Remove this polygon
          }
        }
        return true; // Keep this polygon
      });
    }
    rebuildBarrier();
  }

  // =========================
  // Region fill (flood fill)
  // =========================
  function w2r(p){
    return {
      x: clamp(Math.round((p.x / WORLD_W) * (REG_W-1)), 0, REG_W-1),
      y: clamp(Math.round((p.y / WORLD_H) * (REG_H-1)), 0, REG_H-1)
    };
  }
  function rebuildBarrier(){
    // 0 = blocked, 1 = fillable
    barrier = new Uint8Array(REG_W * REG_H);

    // draw land + borders into a temp canvas, then read pixels
    const temp = document.createElement('canvas');
    temp.width = REG_W; temp.height = REG_H;
    const t = temp.getContext('2d');

    // Fill everything blocked by default, then carve fillable land interior as white
    t.clearRect(0,0,REG_W,REG_H);

    // land interior -> white
    t.fillStyle = "#fff";
    for (const poly of state.land){
      const pts = poly.points;
      if (pts.length < 3) continue;
      t.beginPath();
      const p0 = w2r(pts[0]);
      t.moveTo(p0.x, p0.y);
      for (let i=1;i<pts.length;i++){
        const pi = w2r(pts[i]);
        t.lineTo(pi.x, pi.y);
      }
      t.closePath();
      t.fill();
    }

    // borders/roads become "walls" (black strokes) inside the land
    // This makes flood fill stop at them.
    const wallLines = [...state.borders];
    t.strokeStyle = "#000";
    t.lineCap = "round";
    t.lineJoin = "round";
    for (const l of wallLines){
      if (l.points.length < 2) continue;
      t.lineWidth = Math.max(2, (l.width || 2.5) * (REG_W / WORLD_W) * 6); // beefed wall thickness
      t.beginPath();
      const p0 = w2r(l.points[0]);
      t.moveTo(p0.x, p0.y);
      for (let i=1;i<l.points.length;i++){
        const pi = w2r(l.points[i]);
        t.lineTo(pi.x, pi.y);
      }
      t.stroke();
    }

    // Build barrier: fillable = (pixel is white-ish), blocked otherwise.
    const img = t.getImageData(0,0,REG_W,REG_H).data;
    for (let i=0;i<REG_W*REG_H;i++){
      const off = i*4;
      const r = img[off], g = img[off+1], b = img[off+2];
      // white-ish is land interior
      const isLand = (r > 200 && g > 200 && b > 200);
      // black-ish are walls
      const isWall = (r < 50 && g < 50 && b < 50);
      barrier[i] = (isLand && !isWall) ? 1 : 0;
    }
  }

  function floodFillRegion(worldPoint, cssColor){
    if (!barrier) rebuildBarrier();
    const seed = w2r(worldPoint);
    const idx0 = seed.y*REG_W + seed.x;
    if (barrier[idx0] !== 1) return; // not fillable

    // read region pixels
    const imgData = rctx.getImageData(0,0,REG_W,REG_H);
    const data = imgData.data;

    // target color = current pixel at seed
    const off0 = idx0*4;
    const tr = data[off0], tg = data[off0+1], tb = data[off0+2], ta = data[off0+3];

    // parse cssColor into rgba
    const col = cssToRGBA(cssColor);
    const nr = col.r, ng = col.g, nb = col.b;
    const na = 220; // a bit translucent like the example

    // if already same color, skip
    if (tr===nr && tg===ng && tb===nb && ta===na) return;

    // BFS flood fill
    const qx = new Int32Array(REG_W*REG_H);
    const qy = new Int32Array(REG_W*REG_H);
    let qs = 0, qe = 0;

    const seen = new Uint8Array(REG_W*REG_H);
    qx[qe] = seed.x; qy[qe] = seed.y; qe++;
    seen[idx0] = 1;

    const matchesTarget = (i) => {
      const o = i*4;
      return data[o]===tr && data[o+1]===tg && data[o+2]===tb && data[o+3]===ta;
    };

    while (qs !== qe){
      const x = qx[qs], y = qy[qs]; qs++;
      const idx = y*REG_W + x;
      if (barrier[idx] !== 1) continue;
      if (!matchesTarget(idx)) continue;

      const o = idx*4;
      data[o] = nr; data[o+1] = ng; data[o+2] = nb; data[o+3] = na;

      // neighbors
      if (x>0){
        const ni = idx-1;
        if (!seen[ni]){ seen[ni]=1; qx[qe]=x-1; qy[qe]=y; qe++; }
      }
      if (x<REG_W-1){
        const ni = idx+1;
        if (!seen[ni]){ seen[ni]=1; qx[qe]=x+1; qy[qe]=y; qe++; }
      }
      if (y>0){
        const ni = idx-REG_W;
        if (!seen[ni]){ seen[ni]=1; qx[qe]=x; qy[qe]=y-1; qe++; }
      }
      if (y<REG_H-1){
        const ni = idx+REG_W;
        if (!seen[ni]){ seen[ni]=1; qx[qe]=x; qy[qe]=y+1; qe++; }
      }
    }

    rctx.putImageData(imgData, 0, 0);
  }

  function cssToRGBA(css){
    // quick parse via offscreen canvas
    const tmp = document.createElement('canvas');
    tmp.width = 1; tmp.height = 1;
    const t = tmp.getContext('2d');
    t.clearRect(0,0,1,1);
    t.fillStyle = css;
    t.fillRect(0,0,1,1);
    const d = t.getImageData(0,0,1,1).data;
    return { r:d[0], g:d[1], b:d[2], a:d[3] };
  }

  async function loadRegionPNG(dataUrl){
    return new Promise((resolve) => {
      rctx.clearRect(0,0,REG_W,REG_H);
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => {
        rctx.clearRect(0,0,REG_W,REG_H);
        rctx.drawImage(img, 0, 0, REG_W, REG_H);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  }

  // =========================
  // Drawing (Azgaar-ish style)
  // =========================
  function drawOcean(){
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ocean').trim() || "#5f7770";
    ctx.fillRect(0,0,canvas.clientWidth, canvas.clientHeight);

    // subtle vignette
    const g = ctx.createRadialGradient(
      canvas.clientWidth*0.5, canvas.clientHeight*0.45, 100,
      canvas.clientWidth*0.5, canvas.clientHeight*0.45, Math.max(canvas.clientWidth, canvas.clientHeight)*0.85
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.clientWidth, canvas.clientHeight);

    // paper grain overlay
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0,0,canvas.clientWidth, canvas.clientHeight);
    ctx.restore();
  }

  function withWorldTransform(fn){
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);
    fn();
    ctx.restore();
  }

  function drawBathymetry(landPaths){
    // This is the main "rings" trick: huge translucent strokes around land shapes
    const bands = [
      { w: 260, a: 0.10, c: "rgba(255,255,255,0.10)" },
      { w: 360, a: 0.08, c: "rgba(0,0,0,0.08)" },
      { w: 480, a: 0.06, c: "rgba(255,255,255,0.08)" },
      { w: 620, a: 0.05, c: "rgba(0,0,0,0.06)" },
    ];
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const path of landPaths){
      for (const b of bands){
        ctx.strokeStyle = b.c;
        ctx.lineWidth = b.w;
        ctx.stroke(path);
      }
    }
    ctx.restore();
  }

  function drawLand(landPaths){
    // land fill
    ctx.save();
    ctx.fillStyle = "#eadbbf";
    for (const path of landPaths) ctx.fill(path);

    // subtle inner shading (gives "paper cutout" feel)
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 10;
    for (const path of landPaths) ctx.stroke(path);
    ctx.globalAlpha = 1;

    // coastline ink
    ctx.strokeStyle = "rgba(43,36,28,0.78)";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const path of landPaths) ctx.stroke(path);

    ctx.restore();

    // land paper grain on top of land only (clip)
    ctx.save();
    for (const path of landPaths){
      ctx.save();
      ctx.clip(path);
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0,0,WORLD_W, WORLD_H);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawRegions(){
    // Draw regionCanvas scaled into world
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(regionCanvas, 0, 0, WORLD_W, WORLD_H);
    ctx.restore();
  }

  function parseDash(str){
    const s = String(str||"").trim();
    if (!s || s==="0") return [];
    return s.split(',').map(x=>parseNum(x,0)).filter(n=>n>=0);
  }

  function drawPolyline(line, color, isSelected=false){
    if (line.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = line.width || 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const dash = line.dash || [];
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    for (let i=1;i<line.points.length;i++) ctx.lineTo(line.points[i].x, line.points[i].y);
    ctx.stroke();

    // halo for readability (very subtle)
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = (line.width || 2.5) + 2.0;
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    for (let i=1;i<line.points.length;i++) ctx.lineTo(line.points[i].x, line.points[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (isSelected){
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "rgba(167,208,202,0.9)";
      ctx.lineWidth = (line.width || 2.5) + 3;
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i=1;i<line.points.length;i++) ctx.lineTo(line.points[i].x, line.points[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlace(p, isSelected=false){
    ctx.save();
    const r = p.kind === "place"
      ? (p.type === "capital" ? 9 : 7)
      : 7;

    // marker
    ctx.beginPath();
    ctx.arc(p.x, p.y, r / view.scale, 0, Math.PI*2);

    if (p.kind === "place"){
      ctx.fillStyle = p.type === "capital" ? "rgba(255,225,160,0.95)" : "rgba(248,245,238,0.92)";
    }else{
      ctx.fillStyle = "rgba(255,150,150,0.85)";
    }
    ctx.fill();

    ctx.lineWidth = 2 / view.scale;
    ctx.strokeStyle = "rgba(43,36,28,0.70)";
    ctx.stroke();

    if (isSelected){
      ctx.lineWidth = 3 / view.scale;
      ctx.strokeStyle = "rgba(167,208,202,0.95)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, (r+7) / view.scale, 0, Math.PI*2);
      ctx.stroke();
    }

    // label
    const label = p.kind === "place" ? (p.name || "(unnamed)") : (p.label || p.type);
    ctx.font = `${14 / view.scale}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillStyle = "rgba(43,36,28,0.78)";
    ctx.textBaseline = "middle";
    ctx.fillText(label, p.x + (12 / view.scale), p.y);

    ctx.restore();
  }

  function draw(){
    // Background ocean in screen space
    drawOcean();

    // World-space drawing
    withWorldTransform(() => {
      // create land Path2D list once
      const landPaths = state.land.map(poly => pointsToPath(poly.points));

      // Show/hide per layer
      const showLand = (layer==="all" || layer==="land");
      const showRegions = (layer==="all" || layer==="regions");
      const showBorders = (layer==="all" || layer==="borders");
      const showRoads = (layer==="all" || layer==="roads");
      const showPlaces = (layer==="all" || layer==="places");

      // Bathymetry rings first (ocean-side)
      if (showLand || showRegions) drawBathymetry(landPaths);

      // Regions should be under borders but above land fill looks like your example.
      if (showRegions) drawRegions();

      if (showLand) drawLand(landPaths);

      if (showBorders){
        for (const l of state.borders){
          drawPolyline(l, "rgba(43,36,28,0.35)", (selected?.type==="line" && selected.id===l.id));
        }
        if (currentLine && currentLine.kind==="border"){
          drawPolyline(currentLine, "rgba(43,36,28,0.55)", false);
          // preview to hover
          if (hover && currentLine.points.length){
            const last = currentLine.points[currentLine.points.length-1];
            ctx.save();
            ctx.strokeStyle = "rgba(43,36,28,0.22)";
            ctx.lineWidth = (currentLine.width||2.5);
            ctx.setLineDash([3,6]);
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(hover.x, hover.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      if (showRoads){
        for (const l of state.roads){
          drawPolyline(l, "rgba(43,36,28,0.28)", (selected?.type==="line" && selected.id===l.id));
        }
        if (currentLine && currentLine.kind==="road"){
          drawPolyline(currentLine, "rgba(43,36,28,0.40)", false);
          if (hover && currentLine.points.length){
            const last = currentLine.points[currentLine.points.length-1];
            ctx.save();
            ctx.strokeStyle = "rgba(43,36,28,0.18)";
            ctx.lineWidth = (currentLine.width||2.0);
            ctx.setLineDash([2,8]);
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(hover.x, hover.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      if (showPlaces){
        for (const p of state.places){
          drawPlace(p, (selected?.type==="place" && selected.id===p.id));
        }
      }

      // In-progress land stroke preview
      if (mode==="land" && currentLandStroke && currentLandStroke.length > 1){
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.30)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4,6]);
        ctx.beginPath();
        ctx.moveTo(currentLandStroke[0].x, currentLandStroke[0].y);
        for (let i=1;i<currentLandStroke.length;i++) ctx.lineTo(currentLandStroke[i].x, currentLandStroke[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // Brush cursor preview
      if (mode === "brush" && hover){
        ctx.save();
        ctx.strokeStyle = brushMode === "add" ? "rgba(167,208,202,0.6)" : "rgba(255,120,120,0.6)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4,4]);
        ctx.beginPath();
        ctx.arc(hover.x, hover.y, brushRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // =========================
  // Pointer events
  // =========================
  function pointerPos(e){
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    isPointerDown = true;

    const sp = pointerPos(e);
    const wp = screenToWorld(sp);
    hover = wp;

    if (spaceDown){
      isPanning = true;
      panStart = { sx: sp.x, sy: sp.y, vx: view.x, vy: view.y };
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (mode === "land"){
      pushHistory();
      currentLandStroke = [ clampWorld(wp) ];
      return;
    }

    if (mode === "brush"){
      pushHistory();
      currentBrushStroke = [ clampWorld(wp) ];
      applyBrushStroke(currentBrushStroke, brushMode === "add");
      draw();
      return;
    }

    if (mode === "border" || mode === "road"){
      const kind = mode === "border" ? "border" : "road";
      const w = clampWorld(wp);

      if (!currentLine || currentLine.kind !== kind){
        currentLine = {
          id: id(),
          kind,
          points: [w],
          width: clamp(parseNum(lineWidth.value, kind==="border" ? 2.5 : 2.0), 0.8, 12),
          dash: parseDash(lineDash.value)
        };
      } else {
        currentLine.points.push(w);
      }
      draw();
      return;
    }

    if (mode === "place"){
      pushHistory();
      state.places.push({
        id: id(),
        kind: "place",
        type: placeType.value,
        name: (placeName.value || "").trim(),
        x: clamp(wp.x, 0, WORLD_W),
        y: clamp(wp.y, 0, WORLD_H)
      });
      draw();
      return;
    }

    if (mode === "geo"){
      pushHistory();
      state.places.push({
        id: id(),
        kind: "geo",
        type: geoType.value,
        label: (geoLabel.value || "").trim(),
        x: clamp(wp.x, 0, WORLD_W),
        y: clamp(wp.y, 0, WORLD_H)
      });
      draw();
      return;
    }

    if (mode === "region"){
      pushHistory();
      floodFillRegion(clampWorld(wp), currentRegionColor);
      draw();
      return;
    }

    if (mode === "select"){
      // priority: place > line > land
      const p = hitPlace(wp);
      if (p){
        selected = { type:"place", id: p.id };
        updateSelectionUI();
        draw();
        return;
      }
      const l = hitLine(wp, [...state.borders, ...state.roads]);
      if (l){
        selected = { type:"line", id: l.id };
        updateSelectionUI();
        draw();
        return;
      }
      const land = hitLand(wp);
      if (land){
        selected = { type:"land", id: land.id };
        updateSelectionUI();
        draw();
        return;
      }
      selected = null;
      updateSelectionUI();
      draw();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const sp = pointerPos(e);
    const wp = screenToWorld(sp);
    hover = clampWorld(wp);

    if (!isPointerDown){
      draw();
      return;
    }

    if (isPanning && panStart){
      const dx = sp.x - panStart.sx;
      const dy = sp.y - panStart.sy;
      view.x = panStart.vx + dx;
      view.y = panStart.vy + dy;
      draw();
      return;
    }

    if (mode === "land" && currentLandStroke){
      currentLandStroke.push(clampWorld(wp));
      // redraw less frequently for performance
      if (currentLandStroke.length % 2 === 0) draw();
    }

    if (mode === "brush" && currentBrushStroke){
      const clamped = clampWorld(wp);
      currentBrushStroke.push(clamped);
      // Apply brush at intervals to avoid too many small circles
      if (currentBrushStroke.length % 3 === 0){
        applyBrushStroke(currentBrushStroke, brushMode === "add");
        draw();
      }
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    isPointerDown = false;
    isPanning = false;
    panStart = null;
    canvas.style.cursor = 'crosshair';

    if (mode === "land" && currentLandStroke && currentLandStroke.length > 6){
      // finalize land polygon:
      // simplify, close, smooth, then store
      const smoothIters = clamp(parseInt(landSmooth.value || "3", 10), 1, 6);

      let pts = simplify(currentLandStroke, 3 / view.scale);
      // close by adding first point at end (for smoothing consistency)
      if (pts.length > 2){
        // ensure reasonable closure
        const first = pts[0];
        const last = pts[pts.length-1];
        const dx = first.x - last.x, dy = first.y - last.y;
        if (dx*dx + dy*dy > 9) pts.push({x:first.x, y:first.y});
        // remove duplicate last for closed polygon representation later
        pts.pop();
      }

      // Guard: polygon needs 3 points
      if (pts.length >= 3){
        // smooth closed polygon
        pts = chaikin(pts, smoothIters);
        // clamp to world
        pts = pts.map(clampWorld);

        state.land.push({ id: id(), points: pts });
        rebuildBarrier(); // land changed affects region fill
      }

      currentLandStroke = null;
      draw();
      return;
    }

    currentLandStroke = null;

    if (mode === "brush" && currentBrushStroke){
      currentBrushStroke = null;
      draw();
    }
  });

  // Zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const sp = pointerPos(e);
    const before = screenToWorld(sp);

    const factor = Math.exp((-e.deltaY) * 0.0014);
    const newScale = clamp(view.scale * factor, 0.25, 4.0);

    view.scale = newScale;

    const after = screenToWorld(sp);
    view.x += (after.x - before.x) * view.scale;
    view.y += (after.y - before.y) * view.scale;

    draw();
  }, { passive:false });

  function clampWorld(p){
    return { x: clamp(p.x, 0, WORLD_W), y: clamp(p.y, 0, WORLD_H) };
  }

  // =========================
  // Keyboard
  // =========================
  window.addEventListener('keydown', (e) => {
    if (e.code === "Space" && !spaceDown){
      spaceDown = true;
      if (!isPointerDown) canvas.style.cursor = "grab";
    }

    const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey;
    const isRedo = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase()==="z" && e.shiftKey));
    if (isUndo){ e.preventDefault(); undo(); return; }
    if (isRedo){ e.preventDefault(); redo(); return; }

    if (e.key === "Escape"){
      clearInProgress();
      draw();
      return;
    }

    if (e.key === "Enter"){
      if (currentLine && (mode==="border" || mode==="road") && currentLine.points.length >= 2){
        pushHistory();
        if (currentLine.kind === "border"){
          state.borders.push(currentLine);
          rebuildBarrier(); // borders affect region fill
        } else {
          state.roads.push(currentLine);
        }
        currentLine = null;
        draw();
      }
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace"){
      if (selected){
        pushHistory();
        deleteSelected();
        draw();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === "Space"){
      spaceDown = false;
      canvas.style.cursor = "crosshair";
    }
  });

  function deleteSelected(){
    if (!selected) return;
    if (selected.type === "place"){
      state.places = state.places.filter(p => p.id !== selected.id);
    } else if (selected.type === "line"){
      const beforeBorders = state.borders.length;
      state.borders = state.borders.filter(l => l.id !== selected.id);
      state.roads = state.roads.filter(l => l.id !== selected.id);
      // if a border got deleted, rebuild mask
      if (state.borders.length !== beforeBorders) rebuildBarrier();
    } else if (selected.type === "land"){
      state.land = state.land.filter(l => l.id !== selected.id);
      rebuildBarrier();
    }
    selected = null;
    updateSelectionUI();
  }

  function updateSelectionUI(){
    if (!selected){
      selLabel.textContent = "None";
      selName.value = "";
      return;
    }
    if (selected.type === "place"){
      const p = state.places.find(x => x.id === selected.id);
      if (!p){ selLabel.textContent="None"; selName.value=""; return; }
      selLabel.textContent = `${p.kind}:${p.type}`;
      selName.value = (p.kind==="place") ? (p.name||"") : (p.label||"");
      return;
    }
    if (selected.type === "line"){
      const l = [...state.borders, ...state.roads].find(x => x.id === selected.id);
      selLabel.textContent = l ? `${l.kind} (pts:${l.points.length})` : "Line";
      selName.value = "";
      return;
    }
    if (selected.type === "land"){
      const l = state.land.find(x => x.id === selected.id);
      selLabel.textContent = l ? `land (pts:${l.points.length})` : "Land";
      selName.value = "";
    }
  }

  // =========================
  // Init
  // =========================
  renderSwatches();
  setMode("land");
  setLayer("all");

  // start centered
  view.x = canvas.clientWidth*0.5 - (WORLD_W*view.scale)*0.5;
  view.y = canvas.clientHeight*0.5 - (WORLD_H*view.scale)*0.5;

  rebuildBarrier();
  updateUndoRedo();
  resize();

})();
