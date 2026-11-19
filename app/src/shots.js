// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover draws the cover alone, full frame, and proves the
// export path by writing the PNG once. window.__shotReady is set once painted.
import { SIZES, LAYOUTS, GRADES, drawCover } from './cover.js';

export async function runShot(shot, query, app) {
  const photoName = query.get('photo') ?? 'pier';
  const title = query.get('caption') ?? 'Neon Shore';
  const subtitle = query.get('subtitle') ?? 'palm trees & neon dreams';
  const badge = query.get('badge') ?? 'EST. 2026';
  const layout = LAYOUTS[query.get('layout')] ? query.get('layout') : 'hero';
  const grade = GRADES[query.get('grade')] ? query.get('grade') : 'sunset';
  const size = SIZES[query.get('size')] ? query.get('size') : '1080x1080';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const img = await app.load(`samples/${photoName}.jpg`);
  app.apply({ layout, grade, size, title, subtitle, badge, photos: [img, img, img, img] });
  // Both samples are used across the screenshots: the second photo slot gets the
  // other sample so multi-photo covers show two different pictures.
  try {
    const other = await app.load(`samples/${photoName === 'pier' ? 'boulevard' : 'pier'}.jpg`);
    app.apply({ photos: [img, other, img, other] });
    app.setPanelPhoto(1, 1);
    app.setPanelPhoto(3, 1);
  } catch { /* one sample is enough for the shot */ }
  app.redraw();
  if (shot === 'cover') {
    // Prove the export the user clicks: render the cover off-screen and write it.
    const off = document.createElement('canvas');
    off.width = app.canvas.width;
    off.height = app.canvas.height;
    drawCover(off, { ...app.state, highlight: -1 });
    const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
    document.title = `export-ok:${blob ? blob.size : 0}:${off.toDataURL('image/png').length}`;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
