// Sunset Cover Studio — editor wiring.
// Pick up to three photos (or the free samples), crop and position each,
// choose a layout and a sunset/neon grade, letter the caption, and export
// the cover as a PNG in a post size. Photos are read on this machine with
// object URLs and never uploaded anywhere: the app makes no network request.
import { drawCover, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

const state = {
  layout: 'poster',
  grade: 'sunset',
  photos: [
    { img: null, zoom: 1, dx: 0, dy: 0 },
    { img: null, zoom: 1, dx: 0, dy: 0 },
    { img: null, zoom: 1, dx: 0, dy: 0 },
  ],
  fillOne: false,
  title: 'Sunset Heist',
  subtitle: 'Vice City Nights',
  titleSize: 1,
  titleColor: '#ffffff',
  showSun: true,
  showPalms: true,
  size: 'square',
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

function applySize() {
  const { w, h } = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
}

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function setPhoto(slot, url) {
  state.photos[slot].img = await loadImage(url);
  redraw();
  updateThumbs();
}

function updateThumbs() {
  ['A', 'B', 'C'].forEach((letter, i) => {
    const el = $(`thumb${letter}`);
    if (el) el.textContent = state.photos[i].img ? `Photo ${letter} loaded` : `Photo ${letter} empty`;
  });
}

function segmented(id, values, current, onPick) {
  const box = $(id);
  box.innerHTML = '';
  values.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg' + (v.value === current ? ' on' : '');
    b.textContent = v.label;
    b.addEventListener('click', () => {
      onPick(v.value);
      segmented(id, values, v.value, onPick);
    });
    box.appendChild(b);
  });
}

function refreshSegments() {
  segmented('layouts', LAYOUTS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) })), state.layout, (v) => { state.layout = v; redraw(); });
  segmented('grades', GRADES.map((g) => ({ value: g, label: g[0].toUpperCase() + g.slice(1) })), state.grade, (v) => { state.grade = v; redraw(); });
  segmented('sizes', Object.entries(SIZES).map(([k, v]) => ({ value: k, label: v.label })), state.size, (v) => { state.size = v; applySize(); redraw(); });
}

function bindPhotoControls() {
  const slots = ['A', 'B', 'C'];
  slots.forEach((letter, i) => {
    $(`file${letter}`).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await setPhoto(i, URL.createObjectURL(file));
      status.textContent = `Photo ${letter} loaded — kept on this machine.`;
    });
    $(`sample${letter}`).addEventListener('click', async () => {
      await setPhoto(i, `samples/${i === 1 ? 'boulevard' : 'pier'}.jpg`);
      status.textContent = `Photo ${letter} loaded from the free sample.`;
    });
  });

  const adjust = $('adjustPhoto');
  const syncSliders = () => {
    const p = state.photos[Number(adjust.value)];
    $('zoom').value = p.zoom;
    $('offx').value = p.dx * 100;
    $('offy').value = p.dy * 100;
  };
  adjust.addEventListener('change', syncSliders);
  $('zoom').addEventListener('input', (e) => { state.photos[Number(adjust.value)].zoom = Number(e.target.value); redraw(); });
  $('offx').addEventListener('input', (e) => { state.photos[Number(adjust.value)].dx = Number(e.target.value) / 100; redraw(); });
  $('offy').addEventListener('input', (e) => { state.photos[Number(adjust.value)].dy = Number(e.target.value) / 100; redraw(); });
  $('fillOne').addEventListener('change', (e) => { state.fillOne = e.target.checked; redraw(); });
  syncSliders();
}

function bindCaptionControls() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('titleSize').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); redraw(); });
  document.querySelectorAll('#colors button').forEach((b) => {
    b.addEventListener('click', () => {
      state.titleColor = b.dataset.color;
      document.querySelectorAll('#colors button').forEach((x) => x.classList.toggle('on', x === b));
      redraw();
    });
  });
  $('showSun').addEventListener('change', (e) => { state.showSun = e.target.checked; redraw(); });
  $('showPalms').addEventListener('change', (e) => { state.showPalms = e.target.checked; redraw(); });
  $('shuffle').addEventListener('click', () => {
    state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    state.grade = GRADES[Math.floor(Math.random() * GRADES.length)];
    state.titleColor = ['#ffffff', '#ffe95e', '#ff7ad9', '#7df9ff'][Math.floor(Math.random() * 4)];
    refreshSegments();
    document.querySelectorAll('#colors button').forEach((x) => x.classList.toggle('on', x.dataset.color === state.titleColor));
    redraw();
    status.textContent = `Shuffled: ${state.layout} layout, ${state.grade} grade.`;
  });
}

function exportCover(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved sunset-cover-${w}x${h}.png — your photos never left this machine.`;
  }, 'image/png');
}

function bindExport() {
  $('export').addEventListener('click', () => exportCover(state.size));
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportCover(b.dataset.export));
  });
}

async function boot() {
  refreshSegments();
  bindPhotoControls();
  bindCaptionControls();
  bindExport();
  applySize();
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch (_) { /* Anton missing: canvas falls back to sans-serif */ }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, setPhoto, applySize, redraw);
  } else {
    redraw();
  }
}

boot();
