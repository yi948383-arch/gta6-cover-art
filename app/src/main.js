// Neon Shore — wires the editor: photo slots, layout/grade/size pickers, caption
// fields, panel crop and position by drag and wheel, and the PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { SIZES, LAYOUTS, GRADES, defaultState, drawCover, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const status = document.getElementById('status');
const state = defaultState();
let activePhoto = 0;
let selectedPanel = 0;
let dragging = null;

const $ = (id) => document.getElementById(id);

/** Loads an image from a URL, resolving once it can be drawn on a canvas. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  state.highlight = document.body.classList.contains('shot-cover') ? -1 : selectedPanel;
  drawCover(canvas, state);
  fitPreview();
  syncControls();
}

/** Scales the preview canvas to fit its wrapper without changing its pixels. */
function fitPreview() {
  const wrap = $('previewWrap');
  const availW = wrap.clientWidth;
  const availH = wrap.clientHeight;
  const scale = Math.min(availW / canvas.width, availH / canvas.height, 1.4);
  canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  document.querySelectorAll('.slot').forEach((slot, i) => {
    slot.classList.toggle('active', i === activePhoto);
    slot.classList.toggle('filled', !!state.photos[i]);
    const thumb = slot.querySelector('img');
    if (state.photos[i] && !thumb.src) thumb.src = state.photos[i].src;
    if (!state.photos[i]) thumb.removeAttribute('src');
  });
  $('zoom').value = state.panels[selectedPanel].zoom;
  $('zoomVal').textContent = `${Math.round(state.panels[selectedPanel].zoom * 100)}%`;
  if (document.activeElement !== $('title')) $('title').value = state.title;
  if (document.activeElement !== $('subtitle')) $('subtitle').value = state.subtitle;
  if (document.activeElement !== $('badge')) $('badge').value = state.badge;
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${LAYOUTS[state.layout].panels}`;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
}

function setStatus(text) {
  status.textContent = text;
}

/** Puts an image into a photo slot and redraws. */
function assignPhoto(index, img) {
  state.photos[index] = img;
  redraw();
}

// Photo slots: pick a file, or tap a sample. Tapping a slot makes it the active
// photo; tapping a panel in the preview fills that panel with the active photo.
document.querySelectorAll('.slot').forEach((slot, i) => {
  const input = slot.querySelector('input[type=file]');
  slot.addEventListener('click', (e) => {
    if (e.target === input) return;
    activePhoto = i;
    redraw();
  });
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      assignPhoto(i, await loadImage(URL.createObjectURL(file)));
      setStatus(`Photo ${i + 1} loaded: ${file.name}`);
    } catch {
      setStatus('That file could not be read as an image.');
    }
    input.value = '';
  });
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      assignPhoto(activePhoto, await loadImage(`samples/${btn.dataset.sample}.jpg`));
      setStatus(`Sample photo loaded into slot ${activePhoto + 1}.`);
    } catch {
      setStatus('The sample photo could not be loaded.');
    }
  });
});

$('fillAll').addEventListener('click', () => {
  state.panels.forEach((p) => { p.photo = activePhoto; });
  redraw();
  setStatus(`Every panel now uses photo ${activePhoto + 1}.`);
});

// Layout, grade and size pickers.
document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
  state.layout = b.dataset.layout;
  selectedPanel = Math.min(selectedPanel, LAYOUTS[state.layout].panels - 1);
  redraw();
}));
document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
  state.grade = b.dataset.grade;
  redraw();
}));
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  state.size = b.dataset.size;
  redraw();
}));

// Caption fields.
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
$('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });

// Selected panel: zoom slider, and drag / wheel on the preview to crop it.
$('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width * canvas.width;
  const y = (clientY - rect.top) / rect.height * canvas.height;
  const bandH = Math.round(canvas.height * 0.22);
  const rects = layoutPanels(state.layout, canvas.width, canvas.height, bandH);
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i === -1) return;
  selectedPanel = i;
  state.panels[i].photo = activePhoto;
  dragging = { x: e.clientX, y: e.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const p = state.panels[selectedPanel];
  p.ox = Math.max(-1, Math.min(1, dragging.ox + (e.clientX - dragging.x) / rect.width * 2));
  p.oy = Math.max(-1, Math.min(1, dragging.oy + (e.clientY - dragging.y) / rect.height * 2));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selectedPanel];
  p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  redraw();
}, { passive: false });

// Export: render the cover off-screen at the chosen post size and save the PNG.
$('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, { ...state, highlight: -1 });
  off.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-shore-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved neon-shore-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KB).`);
  }, 'image/png');
});

window.addEventListener('resize', fitPreview);

// Boot: a fixed shot scene for screenshots, else the editor with a sample photo.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    load: loadImage,
    apply: (patch) => Object.assign(state, patch),
    setPanelPhoto: (i, photo) => { state.panels[i].photo = photo; },
    redraw,
    canvas,
    state,
  });
} else {
  loadImage('samples/pier.jpg').then((img) => { assignPhoto(0, img); }).catch(() => redraw());
  redraw();
}
