// Neon Shore cover engine: draws a multi-panel GTA-style poster cover onto a
// canvas from a state object. Everything drawn here is code-drawn original art:
// gradient skies, a slatted synthwave sun, palm silhouettes, grain and vignette.
// No Rockstar logo, artwork or font is used anywhere.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 x 1080' },
};

export const LAYOUTS = {
  hero: { label: 'Hero + three', panels: 4 },
  grid: { label: 'Four-panel grid', panels: 4 },
  strip: { label: 'Triple strip', panels: 3 },
  bleed: { label: 'Full bleed', panels: 1 },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    sky: ['#3b115f', '#c62b7e', '#ff7e5f', '#ffb347'],
    wash: 'rgba(255, 110, 60, 0.10)',
    tint: ['rgba(255, 170, 60, 0)', 'rgba(255, 60, 140, 0.26)'],
    sun: ['#fff3a6', '#ff9a3d', '#ff2e63'],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.12) brightness(0.98)',
    sky: ['#0b1035', '#3d1a78', '#ff2e88', '#22d3ee'],
    wash: 'rgba(40, 220, 255, 0.08)',
    tint: ['rgba(40, 220, 255, 0)', 'rgba(255, 46, 136, 0.28)'],
    sun: ['#c8fff4', '#22d3ee', '#ff2e88'],
  },
  gold: {
    label: 'Golden Hour',
    filter: 'saturate(1.25) contrast(1.06) sepia(0.28) brightness(1.04)',
    sky: ['#4a2408', '#a35a12', '#ffb347', '#ffe9a8'],
    wash: 'rgba(255, 190, 80, 0.10)',
    tint: ['rgba(255, 200, 90, 0)', 'rgba(190, 90, 10, 0.24)'],
    sun: ['#fffbe0', '#ffd166', '#ff7b00'],
  },
  noir: {
    label: 'Mono Noir',
    filter: 'grayscale(1) contrast(1.32) brightness(1.06)',
    sky: ['#0d0d12', '#2a2a33', '#6b6b78', '#d8d8de'],
    wash: 'rgba(255, 255, 255, 0.05)',
    tint: ['rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.30)'],
    sun: ['#ffffff', '#d8d8de', '#8a8a96'],
  },
};

/** A fresh default cover state. Panels each hold a photo index, a zoom and a pan. */
export function defaultState() {
  return {
    layout: 'hero',
    size: '1080x1080',
    grade: 'sunset',
    title: 'NEON SHORE',
    subtitle: 'palm trees & neon dreams',
    badge: 'EST. 2026',
    grain: true,
    vignette: true,
    photos: [null, null, null, null],
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0.65 },
      { photo: 0, zoom: 1, ox: 0, oy: 0.65 },
      { photo: 0, zoom: 1, ox: 0, oy: 0.65 },
      { photo: 0, zoom: 1, ox: 0, oy: 0.65 },
    ],
    highlight: -1,
  };
}

/** Panel rectangles for a layout, inside the photo area above the title band. */
export function layoutPanels(layout, w, h, bandH) {
  const top = h - bandH;
  const g = Math.max(4, Math.round(w * 0.006));
  const area = { x: g, y: g, w: w - g * 2, h: top - g * 2 };
  const third = (area.w - g * 2) / 3;
  const half = (area.h - g) / 2;
  if (layout === 'bleed') return [{ ...area }];
  if (layout === 'strip') {
    return [0, 1, 2].map((i) => ({ x: area.x + i * (third + g), y: area.y, w: third, h: area.h }));
  }
  if (layout === 'grid') {
    const cw = (area.w - g) / 2;
    return [
      { x: area.x, y: area.y, w: cw, h: half },
      { x: area.x + cw + g, y: area.y, w: cw, h: half },
      { x: area.x, y: area.y + half + g, w: cw, h: half },
      { x: area.x + cw + g, y: area.y + half + g, w: cw, h: half },
    ];
  }
  // hero: one big panel on top, three small ones below it.
  return [
    { x: area.x, y: area.y, w: area.w, h: half },
    { x: area.x, y: area.y + half + g, w: third, h: half },
    { x: area.x + third + g, y: area.y + half + g, w: third, h: half },
    { x: area.x + (third + g) * 2, y: area.y + half + g, w: third, h: half },
  ];
}

/** Draws the whole cover for `state` onto `canvas` (sized to the export size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const bandH = Math.round(h * 0.22);
  ctx.save();
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout, w, h, bandH);
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) {
    drawPhotoPanel(ctx, state.photos[state.panels[i].photo] ?? null, rects[i], state.panels[i], grade, i === state.highlight);
  }
  drawTitleBand(ctx, w, h, bandH, state, grade);
  drawBadge(ctx, w, h, state);
  if (state.grain) drawFilmGrain(ctx, w, h, 1337);
  if (state.vignette) drawVignette(ctx, w, h);
  // Thin white poster frame around the whole cover.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(3, Math.round(h * 0.007));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.restore();
}

/** One photo panel: cover-fit crop with zoom/pan, colour grade, white keyline. */
export function drawPhotoPanel(ctx, photo, rect, panel, grade, selected) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo) {
    const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * panel.zoom;
    const dw = photo.naturalWidth * base;
    const dh = photo.naturalHeight * base;
    const dx = rect.x + (rect.w - dw) / 2 + panel.ox * Math.max(0, (dw - rect.w) / 2);
    const dy = rect.y + (rect.h - dh) / 2 + panel.oy * Math.max(0, (dh - rect.h) / 2);
    ctx.filter = grade.filter;
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.filter = 'none';
    applyGrade(ctx, rect, grade);
  } else {
    const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    sky.addColorStop(0, '#241239');
    sky.addColorStop(1, '#12081f');
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = `600 ${Math.round(rect.h * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
  // Keyline and, in the editor, a highlight ring on the selected panel.
  ctx.save();
  ctx.strokeStyle = selected ? '#ffd166' : 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = selected ? Math.max(4, rect.w * 0.008) : Math.max(2, rect.w * 0.004);
  ctx.strokeRect(rect.x + ctx.lineWidth / 2, rect.y + ctx.lineWidth / 2, rect.w - ctx.lineWidth, rect.h - ctx.lineWidth);
  ctx.restore();
}

/** The grade's colour wash over a panel that already holds its photo. */
export function applyGrade(ctx, rect, grade) {
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  tint.addColorStop(0, grade.tint[0]);
  tint.addColorStop(1, grade.tint[1]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
}

/** The sunset title band: sky, slatted sun, palms, big title and subtitle. */
export function drawTitleBand(ctx, w, h, bandH, state, grade) {
  const top = h - bandH;
  const sky = ctx.createLinearGradient(0, top, 0, h);
  grade.sky.forEach((color, i) => sky.addColorStop(i / (grade.sky.length - 1), color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, top, w, bandH);
  drawSynthwaveSun(ctx, w / 2, top + bandH * 0.30, bandH * 0.30, grade);
  drawPalmSilhouette(ctx, w * 0.045, h - bandH * 0.06, bandH * 0.62, -0.22);
  drawPalmSilhouette(ctx, w * 0.955, h - bandH * 0.06, bandH * 0.62, 0.22);
  // Title: heavy condensed capitals, sunset gradient fill, dark outline.
  const text = (state.title || 'UNTITLED').trim().toUpperCase();
  let size = bandH * 0.40;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(10, 4, 24, 0.65)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.04;
  for (;;) {
    ctx.font = `900 ${size}px "Noto Sans", "Arial Narrow", sans-serif`;
    ctx.save();
    ctx.translate(w / 2, 0);
    ctx.scale(0.86, 1);
    const width = ctx.measureText(text).width * 0.86;
    ctx.restore();
    if (width <= w * 0.9 || size <= 20) break;
    size -= 2;
  }
  ctx.font = `900 ${size}px "Noto Sans", "Arial Narrow", sans-serif`;
  const cy = top + bandH * 0.62;
  ctx.translate(w / 2, cy);
  ctx.scale(0.86, 1);
  const fill = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, '#ffe9a8');
  fill.addColorStop(1, '#ff7e5f');
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = '#1a0b2e';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // Subtitle in italic serif, letterspaced, under the title.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    ctx.save();
    ctx.font = `italic 700 ${Math.round(bandH * 0.17)}px "Noto Serif", Georgia, serif`;
    try { ctx.letterSpacing = `${Math.round(bandH * 0.02)}px`; } catch { /* older canvas: no letter spacing */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9f3';
    ctx.shadowColor = 'rgba(10, 4, 24, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(sub, w / 2, top + bandH * 0.88);
    ctx.restore();
  }
}

/** A synthwave sun: gradient disc cut by widening horizontal slats. */
export function drawSynthwaveSun(ctx, cx, cy, r, grade) {
  ctx.save();
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grade.sun.forEach((color, i) => sun.addColorStop(i / (grade.sun.length - 1), color));
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slats: bands of sky colour that widen towards the bottom of the disc.
  const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grade.sky.forEach((color, i) => sky.addColorStop(i / (grade.sky.length - 1), color));
  ctx.fillStyle = sky;
  let y = cy + r * 0.05;
  let gap = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 1, y, r * 2 + 2, gap);
    y += gap + r * 0.16;
    gap *= 1.45;
  }
  ctx.restore();
}

/** A stylised palm silhouette: curved trunk, seven drooping fronds. */
export function drawPalmSilhouette(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s / 100, s / 100);
  ctx.fillStyle = '#160a26';
  ctx.strokeStyle = '#160a26';
  // Trunk, leaning gently.
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.quadraticCurveTo(-2, -55, 6, -92);
  ctx.lineTo(12, -92);
  ctx.quadraticCurveTo(6, -52, 5, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds fanning from the crown: wide drooping blades.
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 27) * (Math.PI / 180);
    const len = 78 - Math.abs(i - 3) * 8;
    const tx = Math.cos(a) * len;
    const ty = Math.sin(a) * len * 0.62 + 20;
    ctx.beginPath();
    ctx.moveTo(9, -92);
    ctx.quadraticCurveTo(9 + tx * 0.55, -92 + ty * 0.35 - 18, 9 + tx, -92 + ty);
    ctx.quadraticCurveTo(9 + tx * 0.45, -92 + ty * 0.62 + 4, 9, -92);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A small tilted ribbon badge in the top-right corner of the cover. */
export function drawBadge(ctx, w, h, state) {
  const label = (state.badge || '').trim();
  if (!label) return;
  const size = Math.round(h * 0.028);
  ctx.save();
  ctx.font = `800 ${size}px "Noto Sans", sans-serif`;
  const pad = size * 0.9;
  const bw = ctx.measureText(label).width + pad * 2;
  const bh = size * 2.1;
  ctx.translate(w - bw / 2 - w * 0.02, bh / 2 + h * 0.018);
  ctx.rotate(-0.06);
  ctx.fillStyle = '#ff2e63';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size * 0.1);
  roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), 0, size * 0.06);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Seeded film grain: the same speckle on every redraw of a cover. */
export function drawFilmGrain(ctx, w, h, seed) {
  let a = seed >>> 0;
  const rand = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  ctx.save();
  const n = Math.round((w * h) / 420);
  for (let i = 0; i < n; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  ctx.restore();
}

/** A soft dark vignette pulling the eye to the middle of the cover. */
export function drawVignette(ctx, w, h) {
  ctx.save();
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(8, 3, 18, 0)');
  g.addColorStop(1, 'rgba(8, 3, 18, 0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
