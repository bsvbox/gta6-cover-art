// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone at an export size.
// Query: photo (pier|boulevard), caption, subtitle, layout, grade, size
// (square|portrait|wide), fill (1 = one photo in every panel).
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, state, setPhoto, applySize, redraw) {
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Vice City Nights';
  state.title = caption;
  state.subtitle = subtitle;
  state.layout = query.get('layout') ?? 'poster';
  state.grade = query.get('grade') ?? 'sunset';
  state.titleColor = query.get('color') ?? '#ffffff';
  state.fillOne = query.get('fill') === '1';
  const size = query.get('size') ?? 'square';
  state.size = size;

  const photoA = query.get('photo') ?? 'pier';
  const photoB = query.get('photoB') ?? 'pier';
  await setPhoto(0, `samples/${photoA}.jpg`);
  await setPhoto(1, `samples/${photoB}.jpg`);
  await setPhoto(2, `samples/${photoA}.jpg`);
  state.photos[1].zoom = 1.25;
  state.photos[2].zoom = 1.15;
  state.photos[2].dx = -0.15;

  const titleInput = document.getElementById('title');
  if (titleInput) titleInput.value = caption;
  const subInput = document.getElementById('subtitle');
  if (subInput) subInput.value = subtitle;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  }
  applySize();
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch (_) { /* fall back to sans-serif */ }
  redraw();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 350));
  redraw();
  window.__shotReady = true;
}
