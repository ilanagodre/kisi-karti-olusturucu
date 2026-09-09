const canvas = document.getElementById('cardCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const els = {
  mainPhoto: document.getElementById('mainPhoto'),
  photo2: document.getElementById('photo2'),
  photo3: document.getElementById('photo3'),
  fullName: document.getElementById('fullName'),
  character: document.getElementById('character'),
  birthDate: document.getElementById('birthDate'),
  height: document.getElementById('height'),
  projects: document.getElementById('projects'),
  generateBtn: document.getElementById('generateBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  newBtn: document.getElementById('newBtn'),
  previewHint: document.getElementById('previewHint'),
};

const loadedImages = { main: null, photo2: null, photo3: null };

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

els.mainPhoto.addEventListener('change', async (e) => {
  loadedImages.main = await readFileAsImage(e.target.files[0]);
});
els.photo2.addEventListener('change', async (e) => {
  loadedImages.photo2 = await readFileAsImage(e.target.files[0]);
});
els.photo3.addEventListener('change', async (e) => {
  loadedImages.photo3 = await readFileAsImage(e.target.files[0]);
});

// Draws an image scaled to fit entirely inside a target box without cropping
// (like CSS object-fit: contain), filling any leftover space with the card
// background so the whole original photo stays visible.
function drawImageContain(context, img, x, y, w, h, bgColor) {
  context.fillStyle = bgColor;
  context.fillRect(x, y, w, h);

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let dw, dh;

  if (imgRatio > boxRatio) {
    dw = w;
    dh = w / imgRatio;
  } else {
    dh = h;
    dw = h * imgRatio;
  }

  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  context.drawImage(img, dx, dy, dw, dh);
}

function drawPlaceholder(context, x, y, w, h, label) {
  context.save();
  context.fillStyle = '#1f1f1f';
  context.fillRect(x, y, w, h);
  context.strokeStyle = '#3a3a3a';
  context.lineWidth = 2;
  context.strokeRect(x, y, w, h);
  context.fillStyle = '#555';
  context.font = '28px "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, x + w / 2, y + h / 2);
  context.restore();
}

// Layout fractions measured directly (pixel-by-pixel) from the reference
// comp-card image (896x574). Canvas W/H keep the same 896:574 ratio, so
// multiplying by W or H reproduces the reference geometry exactly.
const REF = {
  mainX0: 34 / 896,
  mainX1: 418 / 896,
  rightX: 454 / 896,
  smallX0: 705 / 896,
  smallX1: 860 / 896,

  mainY0: 37 / 574,
  mainY1: 538 / 574,
  nameBaseline: 66 / 574,
  karakterBaseline: 92 / 574,
  dateBaseline: 119 / 574,
  diziBaseline: 157 / 574,
  listTopInk: 162 / 574, // top of first list line's glyph ink (not a baseline)
  listBottom: 521 / 574,
  photo2Y0: 122 / 574,
  photo2Y1: 301 / 574,
  photo3Y0: 316 / 574,
  photo3Y1: 518 / 574,
};

function drawCard() {
  const name = els.fullName.value.trim().toUpperCase();
  const character = els.character.value.trim().toUpperCase();
  const birthDate = els.birthDate.value.trim();
  const height = els.height.value.trim();
  const projects = els.projects.value
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Background
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, W, H);

  const pad = 20;
  const gold = '#c8a165';

  // Outer border
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(pad / 2, pad / 2, W - pad, H - pad);

  // --- Main photo (left) ---
  const mainX = REF.mainX0 * W;
  const mainY = REF.mainY0 * H;
  const mainW = (REF.mainX1 - REF.mainX0) * W;
  const mainH = (REF.mainY1 - REF.mainY0) * H;

  if (loadedImages.main) {
    drawImageContain(ctx, loadedImages.main, mainX, mainY, mainW, mainH, '#111111');
  } else {
    drawPlaceholder(ctx, mainX, mainY, mainW, mainH, 'Ana Fotoğraf');
  }
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1;
  ctx.strokeRect(mainX, mainY, mainW, mainH);

  // --- Right column ---
  const rightX = REF.rightX * W;

  // Small photos — sized and stacked to match the reference exactly: the
  // top photo is shorter, the bottom photo taller, with a gap between them.
  const smallX = REF.smallX0 * W;
  const smallW = (REF.smallX1 - REF.smallX0) * W;
  const smallY1 = REF.photo2Y0 * H;
  const smallH1 = (REF.photo2Y1 - REF.photo2Y0) * H;
  const smallY2 = REF.photo3Y0 * H;
  const smallH2 = (REF.photo3Y1 - REF.photo3Y0) * H;
  const narrowW = smallX - rightX - 16; // text column width while small photos are present

  // Name
  ctx.fillStyle = gold;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let nameFontSize = Math.round(H * 0.065);
  ctx.font = `bold ${nameFontSize}px "Segoe UI", sans-serif`;
  while (ctx.measureText(name).width > narrowW && nameFontSize > 22) {
    nameFontSize -= 2;
    ctx.font = `bold ${nameFontSize}px "Segoe UI", sans-serif`;
  }
  ctx.fillText(name || 'ADI SOYADI', rightX, REF.nameBaseline * H);

  // Character (only drawn when provided)
  if (character) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(H * 0.043)}px "Segoe UI", sans-serif`;
    ctx.fillText(`Karakter: ${character}`, rightX, REF.karakterBaseline * H);
  }

  // Birth date | Height
  const metaParts = [];
  if (birthDate) metaParts.push(birthDate);
  if (height) metaParts.push(`${height} cm`);
  ctx.fillStyle = '#d8d8d8';
  ctx.font = `${Math.round(H * 0.043)}px "Segoe UI", sans-serif`;
  ctx.fillText(metaParts.join(' | ') || '-', rightX, REF.dateBaseline * H);

  if (loadedImages.photo2) {
    drawImageContain(ctx, loadedImages.photo2, smallX, smallY1, smallW, smallH1, '#111111');
  } else {
    drawPlaceholder(ctx, smallX, smallY1, smallW, smallH1, 'Foto 2');
  }
  ctx.strokeStyle = '#3a3a3a';
  ctx.strokeRect(smallX, smallY1, smallW, smallH1);

  if (loadedImages.photo3) {
    drawImageContain(ctx, loadedImages.photo3, smallX, smallY2, smallW, smallH2, '#111111');
  } else {
    drawPlaceholder(ctx, smallX, smallY2, smallW, smallH2, 'Foto 3');
  }
  ctx.strokeStyle = '#3a3a3a';
  ctx.strokeRect(smallX, smallY2, smallW, smallH2);

  // "PROJELER" heading
  ctx.fillStyle = gold;
  ctx.font = `bold ${Math.round(H * 0.051)}px "Segoe UI", sans-serif`;
  ctx.fillText('PROJELER', rightX, REF.diziBaseline * H);

  // Project list — occupies the same narrow column as the small photos,
  // matching the reference where the whole list sits beside them.
  const capHeightRatio = 0.72; // approximates cap-height as a fraction of font size
  const listInkTop = REF.listTopInk * H;
  const availableHeight = REF.listBottom * H - listInkTop;
  const upperProjects = projects.map((p) => p.toUpperCase());
  let lineHeight = Math.round(H * 0.0378);
  let fontSize = Math.round(H * 0.027);
  const minFontSize = 11;

  if (upperProjects.length > 0) {
    ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
    let widestLine = Math.max(...upperProjects.map((p) => ctx.measureText(p).width));
    while (
      (lineHeight * upperProjects.length > availableHeight || widestLine > narrowW) &&
      fontSize > minFontSize
    ) {
      fontSize -= 1;
      lineHeight -= 1;
      ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
      widestLine = Math.max(...upperProjects.map((p) => ctx.measureText(p).width));
    }
  }

  ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
  ctx.fillStyle = '#f0ede7';

  // fillText positions by baseline, but listInkTop marks the top of the
  // glyphs — offset down by the cap height to get the first baseline.
  let listY = listInkTop + fontSize * capHeightRatio;
  upperProjects.forEach((text) => {
    ctx.fillText(text, rightX, listY);
    listY += lineHeight;
  });
}

els.newBtn.addEventListener('click', () => {
  window.location.reload();
});

els.generateBtn.addEventListener('click', () => {
  drawCard();
  els.downloadBtn.disabled = false;
  els.previewHint.textContent = 'Önizleme güncellendi. Beğendiyseniz PNG olarak indirebilirsiniz.';
});

els.downloadBtn.addEventListener('click', () => {
  const name = els.fullName.value.trim() || 'kisi-karti';
  const fileName = name
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'kisi-karti'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
});

// Initial empty preview
drawCard();
