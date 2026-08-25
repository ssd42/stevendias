/**********************
 * CONFIGURATION
 **********************/
// To enable Google Drive sync:
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Create OAuth 2.0 Client ID (Web application)
// 3. Add authorized JavaScript origins: http://localhost:8000 (or your domain)
// 4. Either paste the Client ID below, or — to keep it out of source —
//    run this once in the browser console on this page:
//      localStorage.setItem("worldbuilder_google_client_id", "<your-id>")
// This is a browser-only app: it uses the implicit token flow and needs no
// client secret. Never put one in this file — it would be public.
const GOOGLE_CLIENT_ID =
  localStorage.getItem("worldbuilder_google_client_id") ||
  "REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID";

const APP_VERSION = "1.0";
const STORAGE_VERSION = "1.0";

/**********************
 * 1) Default Data
 **********************/
const DEFAULT_WORLD_DATA = {
  "world": {
    title: "My World",
    image: "",
    zones: [],
    labels: [],
    pins: []
  }
};

/**********************
 * 2) LocalStore Module (IndexedDB + localStorage fallback)
 **********************/
const LocalStore = (() => {
  const DB_NAME = "dm-atlas-db";
  const STORE_NAME = "worldState";
  const KEY = "latest";
  const FALLBACK_KEY = "dm_atlas_world_data_v1"; // legacy localStorage key

  let dbInstance = null;
  let useIndexedDB = true;
  let writeTimeout = null;

  // Initialize IndexedDB
  async function initDB() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        console.warn("IndexedDB failed, falling back to localStorage");
        useIndexedDB = false;
        resolve(null);
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  // Get world state
  async function get() {
    if (useIndexedDB) {
      try {
        const db = await initDB();
        if (!db) throw new Error("DB not available");

        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(KEY);

          request.onsuccess = () => {
            const result = request.result;
            if (result?.data) {
              resolve(result.data);
            } else {
              // Try to migrate from localStorage
              const legacy = getLegacyData();
              if (legacy) {
                resolve(legacy);
              } else {
                resolve(null);
              }
            }
          };

          request.onerror = () => resolve(null);
        });
      } catch (err) {
        console.warn("IndexedDB get failed:", err);
        useIndexedDB = false;
      }
    }

    // Fallback to localStorage
    return getLegacyData();
  }

  // Set world state (debounced)
  async function set(worldData, immediate = false) {
    const doWrite = async () => {
      const envelope = {
        version: STORAGE_VERSION,
        updatedAt: Date.now(),
        appVersion: APP_VERSION,
        data: worldData
      };

      if (useIndexedDB) {
        try {
          const db = await initDB();
          if (!db) throw new Error("DB not available");

          return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(envelope, KEY);

            request.onsuccess = () => resolve();
            request.onerror = () => {
              console.warn("IndexedDB write failed, falling back to localStorage");
              useIndexedDB = false;
              setLegacyData(worldData);
              resolve();
            };
          });
        } catch (err) {
          console.warn("IndexedDB set failed:", err);
          useIndexedDB = false;
        }
      }

      // Fallback to localStorage
      setLegacyData(worldData);
    };

    if (immediate) {
      return doWrite();
    }

    // Debounce writes (500ms)
    clearTimeout(writeTimeout);
    writeTimeout = setTimeout(doWrite, 500);
  }

  // Legacy localStorage helpers
  function getLegacyData() {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !parsed.world) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function setLegacyData(worldData) {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(worldData));
    } catch (err) {
      console.error("localStorage write failed:", err);
    }
  }

  return { get, set };
})();

/**********************
 * 3) DriveAdapter Module (Google Drive REST API)
 **********************/
const DriveAdapter = (() => {
  let accessToken = null;
  let tokenClient = null;
  let isGISLoaded = false;

  // Load Google Identity Services script
  function loadGIS() {
    return new Promise((resolve, reject) => {
      if (isGISLoaded) return resolve();

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => {
        isGISLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
      document.head.appendChild(script);
    });
  }

  // Get appropriate scope based on useAppData setting
  function getScope(useAppData) {
    return useAppData
      ? "https://www.googleapis.com/auth/drive.appdata"
      : "https://www.googleapis.com/auth/drive.file";
  }

  // Connect and get OAuth token
  async function connect(useAppData = true) {
    if (GOOGLE_CLIENT_ID === "REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID") {
      throw new Error("Please configure GOOGLE_CLIENT_ID first. See comments at top of app.js");
    }

    await loadGIS();

    return new Promise((resolve, reject) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: getScope(useAppData),
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          accessToken = response.access_token;
          resolve();
        }
      });

      tokenClient.requestAccessToken();
    });
  }

  // Check if connected
  function isConnected() {
    return !!accessToken;
  }

  // Disconnect
  function disconnect() {
    accessToken = null;
    tokenClient = null;
  }

  // Find file by name
  async function findFile(filename, useAppData) {
    if (!accessToken) throw new Error("Not connected to Google Drive");

    const spaces = useAppData ? "appDataFolder" : "drive";
    const query = `name='${filename}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?spaces=${spaces}&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Drive API error:", response.status, errorText);
      throw new Error(`Failed to search files: ${response.status} ${response.statusText || errorText}`);
    }

    const data = await response.json();
    return data.files?.[0] || null;
  }

  // Download file content
  async function downloadFile(fileId) {
    if (!accessToken) throw new Error("Not connected to Google Drive");

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return response.text();
  }

  // Upload file (create or update)
  async function uploadFile(filename, content, useAppData) {
    if (!accessToken) throw new Error("Not connected to Google Drive");

    // Check if file exists
    const existingFile = await findFile(filename, useAppData);

    const metadata = {
      name: filename,
      mimeType: "application/json"
    };

    if (!existingFile && useAppData) {
      metadata.parents = ["appDataFolder"];
    }

    // Create multipart request body
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      content +
      closeDelimiter;

    const method = existingFile ? "PATCH" : "POST";
    const url = existingFile
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return response.json();
  }

  // Load world state from Drive
  async function load(filename, useAppData) {
    const file = await findFile(filename, useAppData);
    if (!file) {
      throw new Error(`File '${filename}' not found in Google Drive`);
    }

    const content = await downloadFile(file.id);
    const parsed = JSON.parse(content);

    // Validate structure
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid file format");
    }

    // Handle both wrapped and unwrapped formats
    if (parsed.data) {
      // Wrapped format with metadata
      if (!parsed.data.world) {
        throw new Error("Invalid file format: missing 'world' data");
      }
      return parsed.data;
    } else {
      // Unwrapped format (direct world data)
      if (!parsed.world) {
        throw new Error("Invalid file format: missing 'world' data");
      }
      return parsed;
    }
  }

  // Save world state to Drive
  async function save(filename, worldData, useAppData) {
    const envelope = {
      version: STORAGE_VERSION,
      updatedAt: Date.now(),
      appVersion: APP_VERSION,
      data: worldData
    };

    const content = JSON.stringify(envelope, null, 2);
    return uploadFile(filename, content, useAppData);
  }

  return { connect, disconnect, isConnected, load, save };
})();

/**********************
 * 4) Storage + State
 **********************/
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// Load initial data from LocalStore
let WORLD_DATA = deepClone(DEFAULT_WORLD_DATA); // Default value for immediate use

// Save to LocalStore
async function saveData() {
  if (!WORLD_DATA) return;
  await LocalStore.set(WORLD_DATA);
}

// Load data from LocalStore (called on init)
async function loadInitialData() {
  const stored = await LocalStore.get();
  if (stored) {
    WORLD_DATA = stored;
    return true; // Data was loaded from storage
  }
  return false; // Using default data
}

// navigation history is map IDs
let history = ["world"];
let currentMapId = "world";
let activeZoneId = null;
let activePinId = null;
let editMode = false;
let textMode = false;
let activeLabelId = null;
let drawingMode = false;
let drawingVertices = [];

// Pan/zoom state (applies to map-content)
let view = { scale: 1, x: 0, y: 0 };
const VIEW_MIN = 0.85;
const VIEW_MAX = 3.0;

/**********************
 * 3) Element Cache
 **********************/
const els = {
  sidebar: document.getElementById("sidebar"),
  mapName: document.getElementById("map-name"),
  list: document.getElementById("zone-list"),
  search: document.getElementById("search"),
  mapImg: document.getElementById("map-img"),
  svg: document.getElementById("svg-overlay"),
  tooltip: document.getElementById("tooltip"),
  scrim: document.getElementById("scrim"),
  wrapper: document.getElementById("map-wrapper"),
  content: document.getElementById("map-content"),

  backBtn: document.getElementById("btn-back"),
  breadcrumb: document.getElementById("breadcrumbs"),
  btnSidebar: document.getElementById("btn-sidebar"),
  btnResetView: document.getElementById("btn-reset-view"),

  // Lore panel
  panel: document.getElementById("info-panel"),
  btnClosePanel: document.getElementById("btn-close-panel"),
  infoTitle: document.getElementById("info-title"),
  infoDesc: document.getElementById("info-desc"),
  infoShops: document.getElementById("info-shops"),
  infoNpcs: document.getElementById("info-npcs"),
  infoHooks: document.getElementById("info-hooks"),
  infoActions: document.getElementById("info-actions"),

  // Edit toggle + panel
  toggleText: document.getElementById("toggle-text"),
  toggleEdit: document.getElementById("toggle-edit"),
  editPanel: document.getElementById("edit-panel"),
  btnCloseEdit: document.getElementById("btn-close-edit"),
  editName: document.getElementById("edit-name"),
  editTarget: document.getElementById("edit-target"),
  editDesc: document.getElementById("edit-desc"),
  editShops: document.getElementById("edit-shops"),
  editNpcs: document.getElementById("edit-npcs"),
  editHooks: document.getElementById("edit-hooks"),
  editHint: document.getElementById("edit-hint"),
  btnSaveEdit: document.getElementById("btn-save-edit"),
  btnDeleteZone: document.getElementById("btn-delete-zone"),
  btnAddZone: document.getElementById("btn-add-zone"),

  // Import/export/reset/help
  btnUploadImage: document.getElementById("btn-upload-image"),
  btnCreateMap: document.getElementById("btn-create-map"),
  btnExport: document.getElementById("btn-export"),
  btnImport: document.getElementById("btn-import"),
  btnReset: document.getElementById("btn-reset"),
  btnHelp: document.getElementById("btn-help"),
  fileInput: document.getElementById("file-input"),
  imageInput: document.getElementById("image-input"),

  // Storage panel
  useAppData: document.getElementById("use-appdata"),
  driveFilename: document.getElementById("drive-filename"),
  btnDriveConnect: document.getElementById("btn-drive-connect"),
  btnDriveSave: document.getElementById("btn-drive-save"),
  btnDriveLoad: document.getElementById("btn-drive-load"),
  driveStatus: document.getElementById("drive-status"),
};

/**********************
 * 4) Helpers
 **********************/
function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "zone";
}

function getMap(mapId) { return WORLD_DATA[mapId]; }

function getZone(mapId, zoneId) {
  const map = getMap(mapId);
  if (!map) return null;
  return (map.zones || []).find(z => z.id === zoneId) || null;
}

function setActive(zoneId) {
  activeZoneId = zoneId;
  activePinId = null;

  // list classes
  [...els.list.querySelectorAll(".zone-item")].forEach(li => li.classList.remove("active"));
  if (zoneId) {
    const li = document.getElementById(`li-${zoneId}`);
    if (li) li.classList.add("active");
  }

  // polygon classes
  [...els.svg.querySelectorAll(".region-poly")].forEach(p => p.classList.remove("active"));
  if (zoneId) {
    const poly = els.svg.querySelector(`.region-poly[data-zone-id="${zoneId}"]`);
    if (poly) poly.classList.add("active");
  }

  // pin classes (not active styling right now, but keep state)
}

function setActivePin(pinId) {
  activePinId = pinId;
  activeZoneId = null;

  [...els.list.querySelectorAll(".zone-item")].forEach(li => li.classList.remove("active"));
  [...els.svg.querySelectorAll(".region-poly")].forEach(p => p.classList.remove("active"));
}

function showScrim(on) {
  els.scrim.style.display = on ? "block" : "none";
}

function closeLorePanel() {
  els.panel.style.display = "none";
  els.infoActions.innerHTML = "";
  showScrim(els.editPanel.style.display === "block"); // keep scrim if edit panel is open
}

function closeEditPanel() {
  els.editPanel.style.display = "none";
  showScrim(els.panel.style.display === "block"); // keep scrim if lore panel is open
}

function closeAllPanels() {
  closeLorePanel();
  closeEditPanel();
  hideTooltip();
  showScrim(false);
}

function hideTooltip() { els.tooltip.style.display = "none"; }

function setBreadcrumbs() {
  const titles = history.map(id => (WORLD_DATA[id]?.title || id));
  els.breadcrumb.textContent = titles.join("  >  ").toUpperCase();
}

function setSidebarOpen(open) {
  if (open) els.sidebar.classList.remove("closed");
  else els.sidebar.classList.add("closed");
}

/**********************
 * 5) Rendering
 **********************/
function render(mapId, push = true) {
  const data = getMap(mapId);
  if (!data) return;

  currentMapId = mapId;

  // history push fix (no duplicates)
  if (push && history[history.length - 1] !== mapId) history.push(mapId);

  // UI basics
  els.mapName.textContent = data.title;
  setBreadcrumbs();

  // Handle empty image - show placeholder
  if (!data.image) {
    els.mapImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 600'%3E%3Crect fill='%23181818' width='1000' height='600'/%3E%3Ctext x='500' y='280' text-anchor='middle' font-family='Cinzel, serif' font-size='24' fill='%23d4af37'%3ENo Map Image%3C/text%3E%3Ctext x='500' y='320' text-anchor='middle' font-family='Arial' font-size='16' fill='%23666'%3EClick \"Upload Image\" to get started%3C/text%3E%3C/svg%3E";
  } else {
    els.mapImg.src = data.image;
  }

  els.backBtn.disabled = history.length <= 1;

  // reset selection + panels
  setActive(null);
  setActivePin(null);
  closeAllPanels();

  // rebuild overlay + list
  els.svg.innerHTML = "";
  els.list.innerHTML = "";

  // zones
  const zones = data.zones || [];
  const filtered = filterZones(zones, els.search.value);

  // sidebar
  filtered.forEach(z => {
    const li = document.createElement("li");
    li.id = `li-${z.id}`;
    li.className = "zone-item";
    li.dataset.zoneId = z.id;

    const extra = [
      z.npcs?.length ? `${z.npcs.length} NPCs` : null,
      z.hooks?.length ? `${z.hooks.length} hooks` : null
    ].filter(Boolean).join(" • ");

    li.innerHTML = `
      <div class="cinzel" style="color:var(--gold)">${escapeHtml(z.name)}</div>
      <div class="sub">${extra || "Click for lore"}</div>
    `;
    els.list.appendChild(li);
  });

  // polygons
  filtered.forEach(z => {
    if (!z.points) return;
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", z.points);
    poly.setAttribute("class", "region-poly");
    poly.setAttribute("data-zone-id", z.id);

    poly.addEventListener("mouseenter", (e) => {
      showTooltipAtPointer(e, z.name, editMode ? "Click to edit" : "Click for lore");
      const li = document.getElementById(`li-${z.id}`);
      if (li) li.classList.add("active");
    });

    poly.addEventListener("mouseleave", () => {
      hideTooltip();
      const li = document.getElementById(`li-${z.id}`);
      // only remove hover highlight if not currently active
      if (li && activeZoneId !== z.id) li.classList.remove("active");
    });

    poly.addEventListener("click", (e) => {
      e.stopPropagation();
      setActive(z.id);
      if (editMode) openEdit(z);
      else openLore(z);
    });

    els.svg.appendChild(poly);
  });

  // pins layer
  const pins = data.pins || [];
  pins.forEach(pin => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "pin");
    g.setAttribute("data-pin-id", pin.id);
    g.setAttribute("transform", `translate(${pin.x}, ${pin.y})`);

    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", "10");
    c.setAttribute("cx", "0");
    c.setAttribute("cy", "0");

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", "0");
    t.setAttribute("y", "1");
    t.textContent = "•";

    g.appendChild(c);
    g.appendChild(t);

    g.addEventListener("mouseenter", (e) => {
      showTooltipAtPointer(e, pin.name, pin.desc || "Point of interest");
    });
    g.addEventListener("mouseleave", hideTooltip);
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      setActivePin(pin.id);
      openPinLore(pin);
    });

    els.svg.appendChild(g);
  });

  // labels layer
  const labels = data.labels || [];
  labels.forEach(label => {
    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute("class", "label-text");
    textEl.setAttribute("data-label-id", label.id);
    textEl.setAttribute("x", label.x);
    textEl.setAttribute("y", label.y);
    textEl.setAttribute("fill", label.color || "#d4af37");
    textEl.setAttribute("font-size", label.fontSize || 20);
    textEl.setAttribute("font-weight", "600");
    textEl.setAttribute("font-family", "Cinzel, serif");
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("pointer-events", "all");
    textEl.setAttribute("style", "cursor: pointer; user-select: none;");
    textEl.textContent = label.text || "";

    if (label.rotation) {
      textEl.setAttribute("transform", `rotate(${label.rotation}, ${label.x}, ${label.y})`);
    }

    textEl.addEventListener("mouseenter", (e) => {
      if (!textMode) {
        showTooltipAtPointer(e, label.text, "Click to edit");
      }
    });
    textEl.addEventListener("mouseleave", hideTooltip);
    textEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (textMode || editMode) {
        editLabel(label);
      }
    });

    els.svg.appendChild(textEl);
  });

  // If sidebar is open on small screens and we navigated, keep it closed by default
  if (window.innerWidth <= 980) setSidebarOpen(false);
}

function filterZones(zones, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return zones;
  return zones.filter(z => {
    const hay = [
      z.id, z.name, z.desc,
      ...(z.shops || []),
      ...(z.npcs || []),
      ...(z.hooks || [])
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

/**********************
 * 6) Lore / Edit
 **********************/
function openLore(zone) {
  setActive(zone.id);

  els.infoTitle.textContent = zone.name || "Unnamed Zone";
  els.infoDesc.textContent = zone.desc || "";

  els.infoShops.innerHTML = (zone.shops || []).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join("") || `<span class="tag">—</span>`;
  els.infoNpcs.innerHTML = (zone.npcs || []).map(n => `<span class="tag" style="border-color: rgba(212,175,55,0.6)">${escapeHtml(n)}</span>`).join("") || `<span class="tag">—</span>`;
  els.infoHooks.innerHTML = (zone.hooks || []).map(h => `<li>${escapeHtml(h)}</li>`).join("") || `<li style="color:var(--text-dim)">—</li>`;

  // Actions (dedicated container: no duplication bug)
  els.infoActions.innerHTML = "";

  const actions = [];

  if (zone.target && WORLD_DATA[zone.target]) {
    const travelBtn = document.createElement("button");
    travelBtn.className = "btn btn-gold";
    travelBtn.textContent = `ENTER ${zone.name.toUpperCase()}`;
    travelBtn.addEventListener("click", () => render(zone.target, true));
    actions.push(travelBtn);
  }

  const focusBtn = document.createElement("button");
  focusBtn.className = "btn btn-ghost";
  focusBtn.textContent = "Center View";
  focusBtn.addEventListener("click", () => centerOnZone(zone));
  actions.push(focusBtn);

  if (editMode) {
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost";
    editBtn.textContent = "Edit Lore";
    editBtn.addEventListener("click", () => openEdit(zone));
    actions.push(editBtn);
  }

  actions.forEach(b => els.infoActions.appendChild(b));

  els.panel.style.display = "block";
  showScrim(true);
}

function openPinLore(pin) {
  els.infoTitle.textContent = pin.name || "Point of Interest";
  els.infoDesc.textContent = pin.desc || "";

  // For pins, we can reuse sections but show empty.
  els.infoShops.innerHTML = `<span class="tag">POI</span>`;
  els.infoNpcs.innerHTML = `<span class="tag">—</span>`;
  els.infoHooks.innerHTML = `<li style="color:var(--text-dim)">—</li>`;

  els.infoActions.innerHTML = "";
  const focusBtn = document.createElement("button");
  focusBtn.className = "btn btn-ghost";
  focusBtn.textContent = "Center View";
  focusBtn.addEventListener("click", () => centerOnPoint(pin.x, pin.y));
  els.infoActions.appendChild(focusBtn);

  els.panel.style.display = "block";
  showScrim(true);
}

let editingZoneId = null;

function openEdit(zone) {
  editingZoneId = zone.id;
  els.editName.value = zone.name || "";
  els.editTarget.value = zone.target || "";
  els.editDesc.value = zone.desc || "";
  els.editShops.value = (zone.shops || []).join("\n");
  els.editNpcs.value = (zone.npcs || []).join("\n");
  els.editHooks.value = (zone.hooks || []).join("\n");

  els.editHint.innerHTML =
    `Editing <b>${escapeHtml(zone.name || zone.id)}</b> in <b>${escapeHtml(getMap(currentMapId)?.title || currentMapId)}</b>.`;

  els.editPanel.style.display = "block";
  showScrim(true);
}

function saveEdit() {
  const map = getMap(currentMapId);
  if (!map) return;

  const z = getZone(currentMapId, editingZoneId);
  if (!z) return;

  z.name = els.editName.value.trim() || z.name || "Unnamed Zone";
  z.target = els.editTarget.value.trim() || "";
  z.desc = els.editDesc.value.trim() || "";

  z.shops = splitLines(els.editShops.value);
  z.npcs = splitLines(els.editNpcs.value);
  z.hooks = splitLines(els.editHooks.value);

  saveData();
  render(currentMapId, false);

  // re-open lore (nice loop)
  const updated = getZone(currentMapId, z.id);
  if (updated && !editMode) openLore(updated);
  if (updated && editMode) {
    // keep edit panel open but updated
    openEdit(updated);
  }
}

function deleteZone() {
  const map = getMap(currentMapId);
  if (!map) return;

  const idx = (map.zones || []).findIndex(z => z.id === editingZoneId);
  if (idx < 0) return;

  const name = map.zones[idx].name || map.zones[idx].id;
  const ok = confirm(`Delete zone "${name}"? This cannot be undone.`);
  if (!ok) return;

  map.zones.splice(idx, 1);
  saveData();
  closeEditPanel();
  render(currentMapId, false);
}

function addNewZone() {
  if (drawingMode) {
    // Cancel drawing mode
    stopDrawingMode(false);
  } else {
    // Start drawing mode
    closeEditPanel(); // Close edit panel if open
    startDrawingMode();
  }
}

function splitLines(text) {
  return String(text || "")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);
}

/**********************
 * 7) Tooltip (less jitter)
 **********************/
function showTooltipAtPointer(e, title, subtitle) {
  const tt = els.tooltip;
  tt.innerHTML = `
    <div class="t1">${escapeHtml(title)}</div>
    <div class="t2">${escapeHtml(subtitle || "")}</div>
  `;
  tt.style.display = "block";

  // position near cursor but clamp to viewport
  const pad = 14;
  const x = e.clientX + 16;
  const y = e.clientY + 16;

  // after render, compute size
  requestAnimationFrame(() => {
    const rect = tt.getBoundingClientRect();
    const nx = Math.min(x, window.innerWidth - rect.width - pad);
    const ny = Math.min(y, window.innerHeight - rect.height - pad);
    tt.style.left = nx + "px";
    tt.style.top = ny + "px";
  });
}

/**********************
 * 8) Pan / Zoom
 **********************/
function applyView() {
  els.content.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
}

function resetView() {
  view = { scale: 1, x: 0, y: 0 };
  applyView();
}

function clampView() {
  view.scale = Math.max(VIEW_MIN, Math.min(VIEW_MAX, view.scale));
}

// center on zone by polygon bbox
function centerOnZone(zone) {
  if (!zone?.points) return;
  const pts = zone.points.split(" ").map(p => p.split(",").map(Number));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  centerOnPoint(cx, cy);
}

function centerOnPoint(contentX, contentY) {
  // content coords are in SVG viewBox space (0..1000,0..600)
  // map-content element has same size as wrapper.
  const w = els.wrapper.clientWidth;
  const h = els.wrapper.clientHeight;

  // Because we are scaling the whole content, compute translation so that (contentX, contentY) ends up center.
  // Convert content coords to pixels in wrapper: since svg viewBox matches 1000x600 but wrapper may differ,
  // but we preserve aspect by stretching (preserveAspectRatio="none"), so treat as proportional.
  const px = (contentX / 1000) * w;
  const py = (contentY / 600) * h;

  // set a reasonable zoom if currently at 1
  if (view.scale < 1.2) view.scale = 1.35;

  // place point at center: center = (w/2, h/2)
  view.x = (w / 2) - (px * view.scale);
  view.y = (h / 2) - (py * view.scale);

  clampView();
  applyView();
}

// drag-to-pan (does NOT steal clicks from polygons/pins)
let dragging = false;
let panArmed = false;
let last = { x: 0, y: 0 };
let start = { x: 0, y: 0 };
const PAN_THRESHOLD = 4;

function isInteractiveTarget(t) {
  // polygons have class region-poly, pins are <g class="pin"> (and children)
  return !!(t.closest && t.closest(".region-poly, .pin, #info-panel, #edit-panel"));
}

els.wrapper.addEventListener("pointerdown", (e) => {
  // Only pan on primary button/touch
  if (e.button !== 0 && e.pointerType === "mouse") return;

  // If user clicked a polygon/pin/panel, don't arm panning (let click work)
  if (isInteractiveTarget(e.target)) return;

  panArmed = true;
  dragging = false;
  start = { x: e.clientX, y: e.clientY };
  last = { x: e.clientX, y: e.clientY };
});

els.wrapper.addEventListener("pointermove", (e) => {
  if (!panArmed) return;

  const dx0 = e.clientX - start.x;
  const dy0 = e.clientY - start.y;

  // Only begin actual dragging after threshold
  if (!dragging && (Math.abs(dx0) > PAN_THRESHOLD || Math.abs(dy0) > PAN_THRESHOLD)) {
    dragging = true;
    els.wrapper.setPointerCapture(e.pointerId);
  }

  if (!dragging) return;

  const dx = e.clientX - last.x;
  const dy = e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };

  view.x += dx;
  view.y += dy;
  applyView();
});

els.wrapper.addEventListener("pointerup", (e) => {
  panArmed = false;
  dragging = false;
  try { els.wrapper.releasePointerCapture(e.pointerId); } catch {}
});

els.wrapper.addEventListener("pointercancel", (e) => {
  panArmed = false;
  dragging = false;
  try { els.wrapper.releasePointerCapture(e.pointerId); } catch {}
});


// wheel zoom at cursor
els.wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = els.wrapper.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const prevScale = view.scale;
  const delta = -e.deltaY;

  const zoomFactor = delta > 0 ? 1.08 : 0.92;
  view.scale *= zoomFactor;
  clampView();

  // zoom around mouse: adjust translate so mouse point stays stable
  const s = view.scale / prevScale;
  view.x = mx - (mx - view.x) * s;
  view.y = my - (my - view.y) * s;

  applyView();
}, { passive: false });

/**********************
 * 9) Import / Export
 **********************/
function exportJSON() {
  const blob = new Blob([JSON.stringify(WORLD_DATA, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dm-atlas-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== "object" || !parsed.world) {
        alert("That JSON doesn't look like valid atlas data (missing 'world').");
        return;
      }
      WORLD_DATA = parsed;
      saveData();
      history = ["world"];
      els.search.value = "";
      render("world", false);
      alert("Import complete.");
    } catch (err) {
      alert("Could not parse JSON file.");
    }
  };
  reader.readAsText(file);
}

async function resetToDefaults() {
  const ok = confirm("Reset all local edits and restore defaults? This will delete your uploaded image and all zones/labels.");
  if (!ok) return;

  // Clear IndexedDB - properly wrapped in promise to wait for completion
  try {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("dm-atlas-db", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction("worldState", "readwrite");
        const store = tx.objectStore("worldState");
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };
    });
  } catch (err) {
    console.warn("Failed to clear IndexedDB:", err);
  }

  // Clear localStorage fallback
  localStorage.removeItem("dm_atlas_world_data_v1");

  // Reset in-memory data
  WORLD_DATA = deepClone(DEFAULT_WORLD_DATA);
  history = ["world"];
  els.search.value = "";

  // Re-render
  render("world", false);

  alert("Reset complete! Your worldbuilder has been cleared.");
}

/**********************
 * 10) Image Upload & Map Creation
 **********************/
async function convertImageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function uploadImage(file) {
  if (!file) return;

  // Check file type
  if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
    alert("Please upload a PNG, JPG, or WebP image.");
    return;
  }

  // Show loading state
  const originalText = els.btnUploadImage.textContent;
  els.btnUploadImage.textContent = "Uploading...";
  els.btnUploadImage.disabled = true;

  convertImageToDataURL(file)
    .then(dataUrl => {
      const map = getMap(currentMapId);
      if (!map) {
        throw new Error("No map found");
      }

      // Update the map image - store exactly as uploaded, no resizing
      map.image = dataUrl;

      // Save and re-render
      saveData();
      render(currentMapId, false);

      alert("Image uploaded successfully!");
    })
    .catch(err => {
      console.error("Image upload error:", err);
      alert(`Failed to upload image: ${err.message}`);
    })
    .finally(() => {
      els.btnUploadImage.textContent = originalText;
      els.btnUploadImage.disabled = false;
      els.imageInput.value = "";
    });
}

function createNewMap() {
  const mapId = prompt("Enter a unique Map ID (lowercase, use underscores for spaces):\nExample: city_map, dungeon_level_2, tavern_interior");
  if (!mapId || !mapId.trim()) return;

  const cleanId = mapId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

  // Check if map already exists
  if (WORLD_DATA[cleanId]) {
    alert(`A map with ID "${cleanId}" already exists. Please choose a different ID.`);
    return;
  }

  const title = prompt("Enter a display name for this map:", cleanId);
  if (title === null) return; // User cancelled

  // Create new map
  WORLD_DATA[cleanId] = {
    title: title.trim() || cleanId,
    image: "",
    zones: [],
    labels: [],
    pins: []
  };

  saveData();

  // Navigate to the new map
  render(cleanId, true);

  alert(`Map "${cleanId}" created! Now upload an image for this map, then draw zones and add labels.`);
}

/**********************
 * 11) Text Annotations
 **********************/
function addLabelAtPoint(svgX, svgY) {
  const map = getMap(currentMapId);
  if (!map) return;

  const text = prompt("Enter label text:");
  if (!text || !text.trim()) return;

  // Generate unique ID
  const labels = map.labels || [];
  let id = `label-${labels.length + 1}`;
  let n = 2;
  while (labels.some(l => l.id === id)) {
    id = `label-${labels.length + n++}`;
  }

  const newLabel = {
    id,
    text: text.trim(),
    x: Math.round(svgX),
    y: Math.round(svgY),
    fontSize: 20,
    color: "#d4af37",
    rotation: 0
  };

  if (!map.labels) map.labels = [];
  map.labels.push(newLabel);

  saveData();
  render(currentMapId, false);
}

function editLabel(label) {
  const map = getMap(currentMapId);
  if (!map) return;

  const text = prompt("Edit label text:", label.text);
  if (text === null) return; // User cancelled

  if (!text.trim()) {
    // Delete if empty
    const ok = confirm("Delete this label?");
    if (ok) {
      deleteLabel(label.id);
    }
    return;
  }

  label.text = text.trim();
  saveData();
  render(currentMapId, false);
}

function deleteLabel(labelId) {
  const map = getMap(currentMapId);
  if (!map || !map.labels) return;

  const idx = map.labels.findIndex(l => l.id === labelId);
  if (idx >= 0) {
    map.labels.splice(idx, 1);
    saveData();
    render(currentMapId, false);
  }
}

/**********************
 * 12) Zone Drawing
 **********************/
function startDrawingMode() {
  drawingMode = true;
  drawingVertices = [];

  // Visual feedback
  els.btnAddZone.textContent = "Drawing... (Double-click to finish)";
  els.btnAddZone.style.borderColor = "var(--gold)";

  // Create a temporary drawing layer
  renderDrawingGuides();
}

function stopDrawingMode(save = false) {
  if (save && drawingVertices.length >= 3) {
    // Save the zone
    saveDrawnZone();
  }

  drawingMode = false;
  drawingVertices = [];

  // Reset UI
  els.btnAddZone.textContent = "Add New Zone";
  els.btnAddZone.style.borderColor = "";

  // Clear drawing guides
  const guides = els.svg.querySelectorAll(".drawing-guide, .drawing-vertex");
  guides.forEach(el => el.remove());
}

function renderDrawingGuides() {
  // Clear existing guides
  const guides = els.svg.querySelectorAll(".drawing-guide, .drawing-vertex");
  guides.forEach(el => el.remove());

  if (!drawingMode || drawingVertices.length === 0) return;

  // Draw lines between vertices
  if (drawingVertices.length > 1) {
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    const points = drawingVertices.map(v => `${v.x},${v.y}`).join(" ");
    polyline.setAttribute("points", points);
    polyline.setAttribute("class", "drawing-guide");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#d4af37");
    polyline.setAttribute("stroke-width", "2");
    polyline.setAttribute("stroke-dasharray", "5,5");
    polyline.setAttribute("pointer-events", "none");
    els.svg.appendChild(polyline);
  }

  // Draw vertex circles
  drawingVertices.forEach((v, i) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", v.x);
    circle.setAttribute("cy", v.y);
    circle.setAttribute("r", "6");
    circle.setAttribute("class", "drawing-vertex");
    circle.setAttribute("fill", "#d4af37");
    circle.setAttribute("stroke", "#000");
    circle.setAttribute("stroke-width", "2");
    circle.setAttribute("pointer-events", "all");
    circle.setAttribute("style", "cursor: pointer;");
    circle.setAttribute("data-vertex-index", i);

    // First vertex is highlighted (can double-click to close)
    if (i === 0 && drawingVertices.length > 2) {
      circle.setAttribute("r", "8");
      circle.setAttribute("fill", "#fff");
      circle.setAttribute("stroke", "#d4af37");
      circle.setAttribute("stroke-width", "3");
    }

    els.svg.appendChild(circle);
  });
}

function saveDrawnZone() {
  const map = getMap(currentMapId);
  if (!map) return;

  const name = prompt("Zone name:");
  if (!name || !name.trim()) {
    drawingVertices = [];
    renderDrawingGuides();
    return;
  }

  // Generate ID
  const idBase = slugify(name);
  let id = idBase;
  let n = 2;
  while ((map.zones || []).some(z => z.id === id)) {
    id = `${idBase}_${n++}`;
  }

  // Convert vertices to points string
  const points = drawingVertices.map(v => `${Math.round(v.x)},${Math.round(v.y)}`).join(" ");

  const newZone = {
    id,
    name: name.trim(),
    target: "",
    points,
    desc: "",
    shops: [],
    npcs: [],
    hooks: []
  };

  map.zones = map.zones || [];
  map.zones.push(newZone);

  saveData();
  render(currentMapId, false);

  // Open edit panel for the new zone
  setActive(id);
  openEdit(newZone);
}

/**********************
 * 13) Safety: escaping
 **********************/
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**********************
 * 14) Google Drive Storage Handlers
 **********************/
function updateDriveUI() {
  const connected = DriveAdapter.isConnected();
  els.btnDriveSave.disabled = !connected;
  els.btnDriveLoad.disabled = !connected;
  els.btnDriveConnect.textContent = connected ? "Disconnect" : "Connect Drive";

  if (connected) {
    const useAppData = els.useAppData.checked;
    const location = useAppData ? "hidden folder" : "My Drive";
    els.driveStatus.textContent = `Connected (${location})`;
    els.driveStatus.style.color = "var(--gold)";
  } else {
    els.driveStatus.textContent = "Not connected";
    els.driveStatus.style.color = "var(--text-dim)";
  }
}

async function handleDriveConnect() {
  try {
    if (DriveAdapter.isConnected()) {
      DriveAdapter.disconnect();
      updateDriveUI();
      return;
    }

    els.driveStatus.textContent = "Connecting...";
    els.driveStatus.style.color = "var(--text-dim)";

    const useAppData = els.useAppData.checked;
    await DriveAdapter.connect(useAppData);

    updateDriveUI();
    els.driveStatus.textContent = "Connected successfully!";
    els.driveStatus.style.color = "var(--gold)";

    setTimeout(updateDriveUI, 2000);
  } catch (err) {
    console.error("Drive connect error:", err);
    els.driveStatus.textContent = `Error: ${err.message}`;
    els.driveStatus.style.color = "#ff5c5c";
    updateDriveUI();
  }
}

async function handleDriveSave() {
  try {
    const filename = els.driveFilename.value.trim() || "worldbuilder.json";
    const useAppData = els.useAppData.checked;

    els.driveStatus.textContent = "Saving...";
    els.driveStatus.style.color = "var(--text-dim)";

    await DriveAdapter.save(filename, WORLD_DATA, useAppData);

    els.driveStatus.textContent = `Saved to ${filename}`;
    els.driveStatus.style.color = "var(--gold)";

    setTimeout(updateDriveUI, 2000);
  } catch (err) {
    console.error("Drive save error:", err);
    els.driveStatus.textContent = `Save failed: ${err.message}`;
    els.driveStatus.style.color = "#ff5c5c";
  }
}

async function handleDriveLoad() {
  try {
    const filename = els.driveFilename.value.trim() || "worldbuilder.json";
    const useAppData = els.useAppData.checked;

    const ok = confirm(`Load "${filename}" from Google Drive? This will replace your current atlas.`);
    if (!ok) return;

    els.driveStatus.textContent = "Loading...";
    els.driveStatus.style.color = "var(--text-dim)";

    const loadedData = await DriveAdapter.load(filename, useAppData);

    // Update state
    WORLD_DATA = loadedData;

    // Save to LocalStore
    await LocalStore.set(WORLD_DATA, true);

    // Reset navigation
    history = ["world"];
    els.search.value = "";

    // Re-render
    render("world", false);

    els.driveStatus.textContent = `Loaded from ${filename}`;
    els.driveStatus.style.color = "var(--gold)";

    setTimeout(updateDriveUI, 2000);
  } catch (err) {
    console.error("Drive load error:", err);
    els.driveStatus.textContent = `Load failed: ${err.message}`;
    els.driveStatus.style.color = "#ff5c5c";
  }
}

/**********************
 * 15) Events
 **********************/
async function init() {
  // Load data from LocalStore first
  await loadInitialData();

  // Start at world WITHOUT pushing duplicates
  render("world", false);
  resetView();
  setSidebarOpen(window.innerWidth <= 980 ? false : true);

  // Back navigation
  els.backBtn.addEventListener("click", () => {
    if (history.length > 1) {
      history.pop();
      const id = history[history.length - 1];
      render(id, false);
    }
  });

  // Sidebar toggle (mobile)
  els.btnSidebar.addEventListener("click", () => {
    setSidebarOpen(els.sidebar.classList.contains("closed"));
  });

  // Reset view
  els.btnResetView.addEventListener("click", resetView);

  // Search rerender
  els.search.addEventListener("input", () => render(currentMapId, false));

  // Click sidebar item -> lore or edit
  els.list.addEventListener("click", (e) => {
    const li = e.target.closest(".zone-item");
    if (!li) return;
    const zoneId = li.dataset.zoneId;
    const z = getZone(currentMapId, zoneId);
    if (!z) return;
    setActive(zoneId);
    if (window.innerWidth <= 980) setSidebarOpen(false);
    if (editMode) openEdit(z);
    else openLore(z);
  });

  // Text toggle
  els.toggleText.addEventListener("click", () => {
    textMode = !textMode;
    els.toggleText.classList.toggle("on", textMode);

    // Turn off edit mode when text mode is on
    if (textMode && editMode) {
      editMode = false;
      els.toggleEdit.classList.remove("on");
    }
  });

  // Edit toggle
  els.toggleEdit.addEventListener("click", () => {
    editMode = !editMode;
    els.toggleEdit.classList.toggle("on", editMode);

    // Turn off text mode when edit mode is on
    if (editMode && textMode) {
      textMode = false;
      els.toggleText.classList.remove("on");
    }

    // if panel open, update action button
    if (els.panel.style.display === "block" && activeZoneId) {
      const z = getZone(currentMapId, activeZoneId);
      if (z) openLore(z);
    }
  });

  // Close buttons
  els.btnClosePanel.addEventListener("click", closeLorePanel);
  els.btnCloseEdit.addEventListener("click", closeEditPanel);

  // Scrim click closes panels
  els.scrim.addEventListener("click", closeAllPanels);

  // Map-stage click closes tooltip/panels (only if not in wrapper drag)
  document.getElementById("map-stage").addEventListener("click", (e) => {
    // don't close if clicking inside panels
    if (els.panel.contains(e.target) || els.editPanel.contains(e.target)) return;
    closeAllPanels();
  });

  // SVG click for text placement and zone drawing
  els.svg.addEventListener("click", (e) => {
    // Convert click coordinates to SVG coordinates
    const rect = els.svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * 1000;
    const svgY = (y / rect.height) * 600;

    // Drawing mode: place vertices
    if (drawingMode) {
      // Don't place vertex on existing elements
      if (e.target.classList.contains("region-poly") ||
          e.target.classList.contains("label-text") ||
          e.target.closest(".pin")) {
        return;
      }

      // Check if clicking on first vertex to close (needs at least 3 vertices)
      if (e.target.classList.contains("drawing-vertex")) {
        const vertexIndex = parseInt(e.target.getAttribute("data-vertex-index"));
        if (vertexIndex === 0 && drawingVertices.length >= 3) {
          // Close the polygon
          stopDrawingMode(true);
          return;
        }
      }

      // Add new vertex
      drawingVertices.push({ x: svgX, y: svgY });
      renderDrawingGuides();
      return;
    }

    // Text mode: place labels
    if (textMode) {
      // Don't place text if clicking on existing elements
      if (e.target.classList.contains("region-poly") ||
          e.target.classList.contains("label-text") ||
          e.target.closest(".pin")) {
        return;
      }

      addLabelAtPoint(svgX, svgY);
    }
  });

  // Double-click to finish drawing
  els.svg.addEventListener("dblclick", (e) => {
    if (drawingMode && drawingVertices.length >= 3) {
      e.preventDefault();
      stopDrawingMode(true);
    }
  });

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawingMode) {
        stopDrawingMode(false);
      } else {
        closeAllPanels();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      // focus search
      e.preventDefault();
      setSidebarOpen(true);
      els.search.focus();
    }
  });

  // Import/Export/Reset/Help
  els.btnUploadImage.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", () => {
    const file = els.imageInput.files?.[0];
    if (file) uploadImage(file);
  });

  els.btnCreateMap.addEventListener("click", createNewMap);

  els.btnExport.addEventListener("click", exportJSON);

  els.btnImport.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", () => {
    const file = els.fileInput.files?.[0];
    els.fileInput.value = "";
    if (file) importJSON(file);
  });

  els.btnReset.addEventListener("click", resetToDefaults);

  els.btnHelp.addEventListener("click", () => {
    alert(
`Quick Controls:

GETTING STARTED:
1. Upload Image: add your map
2. Add New Zone: draw regions on your map
3. Toggle TEXT: add labels to your map
4. Toggle EDIT: click zones to add lore

MAP NAVIGATION:
- Click a zone: view lore panel
- Mouse wheel: zoom in/out
- Click-drag: pan around map
- Reset View: reset zoom/pan
- ← BACK: return to previous map

DRAWING ZONES:
- Click "Add New Zone" in sidebar
- Click to place vertices
- Click first vertex or double-click to finish
- Enter zone name and details
- Esc to cancel drawing

TEXT LABELS:
- Toggle TEXT mode on
- Click anywhere on map to place text
- Click existing text to edit/delete

EDITING ZONES:
- Toggle EDIT mode on
- Click a zone to edit its lore
- Add description, shops, NPCs, plot hooks
- Set "Travel Target Map ID" to link to another map

CREATING LINKED MAPS:
1. Click "Create New Map" in sidebar
2. Enter a Map ID (e.g., "city_map")
3. Upload an image for the new map
4. Draw zones and add labels
5. Link zones to this map by setting "Travel Target Map ID" to the Map ID in zone edit panel

KEYBOARD:
- Esc: close panels / cancel drawing
- Ctrl/Cmd+F: focus search

DATA:
- Export/Import: save/restore atlas JSON
- Google Drive: cloud sync (optional)`
    );
  });

  // Edit panel actions
  els.btnSaveEdit.addEventListener("click", saveEdit);
  els.btnDeleteZone.addEventListener("click", deleteZone);
  els.btnAddZone.addEventListener("click", addNewZone);

  // Autosave on Enter? (optional) - keep explicit save but also save on blur
  [
    els.editName, els.editTarget, els.editDesc, els.editShops, els.editNpcs, els.editHooks
  ].forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        saveEdit();
      }
    });
  });

  // Keep sidebar state sensible on resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) setSidebarOpen(true);
    // also keep view transform stable
    applyView();
  });

  // Google Drive storage events
  els.btnDriveConnect.addEventListener("click", handleDriveConnect);
  els.btnDriveSave.addEventListener("click", handleDriveSave);
  els.btnDriveLoad.addEventListener("click", handleDriveLoad);
  updateDriveUI();
}

init();
