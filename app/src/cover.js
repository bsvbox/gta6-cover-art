// Sunset Cover Studio — cover renderer.
// Draws a multi-panel GTA-style poster cover onto any canvas: the person's
// photos fill the panels, a Vice City sunset or neon grade washes over them,
// and the caption is lettered big in the vendored Anton font. Every drawing
// here (sun, palms, skyline, frames) is made with canvas paths, nothing is
// copied from any game. The same function draws the live preview and the
// exported PNG, so what the maker sees is exactly what they share.
//
// State shape:
//   layout: 'poster' | 'grid' | 'trio' | 'hero'
//   grade: 'sunset' | 'neon' | 'dusk' | 'noir'
//   photos: [{ img, zoom, dx, dy }, ...] — three slots, A/B/C
//   fillOne: boolean — every panel uses photo A
//   title, subtitle, titleSize (0.8..1.3), titleColor, showSun, showPalms

export const LAYOUTS = ['poster', 'grid', 'trio', 'hero'];
export const GRADES = ['sunset', 'neon', 'dusk', 'noir'];

const GRADE_FILTER = {
  sunset: 'saturate(1.3) contrast(1.12) brightness(1.03)',
  neon: 'saturate(1.55) contrast(1.15) brightness(1.0) hue-rotate(-8deg)',
  dusk: 'saturate(1.15) contrast(1.1) brightness(0.94) hue-rotate(18deg)',
  noir: 'grayscale(1) contrast(1.35) brightness(1.05)',
};

/** Panels for a layout: rects in canvas space, first one is the hero panel. */
export function layoutPanels(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012) || 8; // white poster gutter
  if (layout === 'hero') return [{ x: g, y: g, w: w - 2 * g, h: h - 2 * g }];
  if (layout === 'trio') {
    const pw = (w - 4 * g) / 3;
    return [0, 1, 2].map((i) => ({ x: g + i * (pw + g), y: g, w: pw, h: h - 2 * g }));
  }
  if (layout === 'grid') {
    const pw = (w - 3 * g) / 2;
    const ph = (h - 3 * g) / 2;
    return [
      { x: g, y: g, w: pw, h: ph },
      { x: 2 * g + pw, y: g, w: pw, h: ph },
      { x: g, y: 2 * g + ph, w: pw, h: ph },
      { x: 2 * g + pw, y: 2 * g + ph, w: pw, h: ph },
    ];
  }
  // poster: big hero on top, two panels below
  const heroH = Math.round(h * 0.56);
  const lowH = h - heroH - 3 * g;
  const pw = (w - 3 * g) / 2;
  return [
    { x: g, y: g, w: w - 2 * g, h: heroH },
    { x: g, y: heroH + 2 * g, w: pw, h: lowH },
    { x: 2 * g + pw, y: heroH + 2 * g, w: pw, h: lowH },
  ];
}

/** Which photo slot fills each panel: poster/grid/trio cycle A, B, C, A... */
export function panelPhotoIndexes(layout, panelCount) {
  if (layout === 'hero') return [0];
  const order = [0, 1, 2, 1];
  return Array.from({ length: panelCount }, (_, i) => order[i % order.length]);
}

function drawPhotoInto(ctx, photo, rect) {
  if (!photo || !photo.img) {
    // Empty slot: warm paper with a hint of what goes here.
    ctx.fillStyle = '#e8d9c8';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(60, 20, 60, 0.55)';
    ctx.font = `bold ${Math.max(14, rect.w * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const img = photo.img;
  const zoom = photo.zoom || 1;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * base;
  const ph = img.naturalHeight * base;
  const ox = rect.x + (rect.w - pw) / 2 + (photo.dx || 0) * rect.w * 0.25;
  const oy = rect.y + (rect.h - ph) / 2 + (photo.dy || 0) * rect.h * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, ox, oy, pw, ph);
  ctx.restore();
}

function gradeWash(ctx, grade, w, h) {
  ctx.save();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255, 140, 60, 0.10)');
    g.addColorStop(0.55, 'rgba(255, 90, 120, 0.12)');
    g.addColorStop(1, 'rgba(140, 30, 120, 0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    ctx.globalCompositeOperation = 'overlay';
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255, 0, 150, 0.35)');
    g.addColorStop(0.5, 'rgba(120, 0, 255, 0.18)');
    g.addColorStop(1, 'rgba(0, 220, 255, 0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade === 'dusk') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(80, 40, 160, 0.22)');
    g.addColorStop(1, 'rgba(255, 110, 80, 0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // Vignette: darken the corners so the lettering pops.
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(10, 0, 20, 0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawSynthwaveSun(ctx, cx, cy, r) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe95e');
  g.addColorStop(0.55, '#ff7a3d');
  g.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slits across the lower half, widening toward the bottom.
  ctx.fillStyle = 'rgba(20, 5, 40, 0.9)';
  let y = cy + r * 0.05;
  let th = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, th);
    y += th + r * 0.16;
    th *= 1.5;
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.strokeStyle = '#160a24';
  ctx.fillStyle = '#160a24';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -60, -6, -110);
  ctx.stroke();
  // Fronds: five arcs fanning from the crown.
  for (let i = 0; i < 5; i++) {
    const a = (-150 + i * 38) * (Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(-6, -110);
    ctx.quadraticCurveTo(-6 + Math.cos(a) * 45, -110 + Math.sin(a) * 45 - 18, -6 + Math.cos(a) * 78, -110 + Math.sin(a) * 78 + 26);
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(-6, -110, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx, rect) {
  const base = rect.y + rect.h;
  const tops = [0.58, 0.3, 0.66, 0.22, 0.52, 0.38, 0.62];
  const bw = rect.w / tops.length;
  ctx.fillStyle = 'rgba(22, 8, 38, 0.85)';
  tops.forEach((t, i) => {
    const bh = rect.h * (1 - t) * 0.8;
    ctx.fillRect(rect.x + i * bw + 2, base - bh, bw - 4, bh);
  });
  // Lit windows.
  ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
  const ww = Math.max(4, rect.w * 0.006);
  const wh = Math.max(6, rect.h * 0.06);
  for (let i = 0; i < tops.length; i++) {
    for (let r = 0; r < 3; r++) {
      if ((i * 3 + r) % 2 === 0) {
        ctx.fillRect(rect.x + i * bw + bw * 0.3, base - rect.h * 0.3 - r * rect.h * 0.09, ww, wh);
      }
    }
  }
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** Draws the whole cover. `state` follows the shape in the header comment. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const s = Math.min(w, h) / 1080; // scale factor for strokes and type
  // Poster paper: white gutters and outer frame.
  ctx.fillStyle = '#f7f1e8';
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(state.layout, w, h);
  const photoIdx = panelPhotoIndexes(state.layout, panels.length);
  const hero = panels[0];
  panels.forEach((rect, i) => {
    const slot = state.fillOne ? 0 : photoIdx[i];
    const photo = state.photos[slot];
    ctx.save();
    ctx.filter = GRADE_FILTER[state.grade] || GRADE_FILTER.sunset;
    drawPhotoInto(ctx, photo, rect);
    ctx.restore();
    // Thin dark keyline around each panel.
    ctx.strokeStyle = 'rgba(20, 8, 30, 0.55)';
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Grade wash + vignette over the whole poster.
  gradeWash(ctx, state.grade, w, h);

  // Own artwork on the hero panel: synthwave sun, skyline, palms. Only when
  // the hero panel is wide enough that the art frames the photo instead of
  // covering a face (poster and hero layouts); narrow panels stay clean.
  const heroWide = hero.w / hero.h >= 1.2;
  if (heroWide) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(hero.x, hero.y, hero.w, hero.h);
    ctx.clip();
    if (state.showSun !== false) {
      drawSynthwaveSun(ctx, hero.x + hero.w * 0.72, hero.y + hero.h * 0.42, Math.min(hero.w, hero.h) * 0.26);
    }
    drawSkyline(ctx, { x: hero.x, y: hero.y + hero.h * 0.62, w: hero.w, h: hero.h * 0.38 });
    if (state.showPalms !== false) {
      drawPalm(ctx, hero.x + hero.w * 0.06, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.0022, -0.08);
      drawPalm(ctx, hero.x + hero.w * 0.94, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.0018, 0.1);
    }
    ctx.restore();
  }

  // Place tag, top-left of the hero panel.
  ctx.font = `bold ${Math.max(13, 20 * s)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  const tag = 'VICE CITY';
  const tagW = ctx.measureText(tag).width + 28 * s;
  const tagH = 34 * s;
  ctx.fillStyle = 'rgba(12, 4, 24, 0.82)';
  ctx.fillRect(hero.x + 14 * s, hero.y + 14 * s, tagW, tagH);
  ctx.fillStyle = '#ffe95e';
  ctx.fillText(tag, hero.x + 28 * s, hero.y + 14 * s + tagH * 0.72);

  // Title band: dark scrim across the foot, then the big caption.
  const bandH = h * 0.21;
  const band = ctx.createLinearGradient(0, h - bandH * 1.6, 0, h);
  band.addColorStop(0, 'rgba(12, 4, 24, 0)');
  band.addColorStop(1, 'rgba(12, 4, 24, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH * 1.6, w, bandH * 1.6);

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    ctx.save();
    ctx.translate(w / 2, h - bandH * 0.45);
    ctx.rotate(-0.022);
    const size = fitFont(ctx, title, w * 0.92, h * 0.115 * (state.titleSize || 1), 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#14081f';
    ctx.lineWidth = size * 0.16;
    ctx.shadowColor = 'rgba(255, 46, 136, 0.65)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeText(title, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = state.titleColor || '#ffffff';
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    ctx.save();
    ctx.font = `bold ${Math.max(13, 26 * s)}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, 6 * s)}px`; } catch (_) { /* older canvas: ignore */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe95e';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    const sy = h - bandH * 0.45 + h * 0.115 * (state.titleSize || 1) * 0.55;
    // Side rules flanking the subtitle.
    const sw = ctx.measureText(sub).width;
    ctx.strokeStyle = '#ffe95e';
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.beginPath();
    ctx.moveTo(w / 2 - sw / 2 - 90 * s, sy);
    ctx.lineTo(w / 2 - sw / 2 - 18 * s, sy);
    ctx.moveTo(w / 2 + sw / 2 + 18 * s, sy);
    ctx.lineTo(w / 2 + sw / 2 + 90 * s, sy);
    ctx.stroke();
    ctx.fillText(sub, w / 2, sy);
    ctx.restore();
  }
}
