const TOTAL_FRAMES = 240;
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');

const images = [];
let loadedCount = 0;
let currentFrameIndex = 0;
let targetFrameIndex = 0;
let isLoaded = false;

function getFrameUrl(index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `frames/ezgif-frame-${frameNumber}.jpg`;
}

function setupCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function drawFrame(frameIndex) {
  let img = images[frameIndex];
  if (!img || !img.complete || img.naturalWidth === 0) {
    // Find closest loaded frame to prevent black screen flickers
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prevIdx = frameIndex - offset;
      if (prevIdx >= 0 && images[prevIdx] && images[prevIdx].complete && images[prevIdx].naturalWidth > 0) {
        img = images[prevIdx];
        break;
      }
      const nextIdx = frameIndex + offset;
      if (nextIdx < TOTAL_FRAMES && images[nextIdx] && images[nextIdx].complete && images[nextIdx].naturalWidth > 0) {
        img = images[nextIdx];
        break;
      }
    }
  }

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const cw = canvas.width;
  const ch = canvas.height;

  // Object-fit COVER calculation to fill 100% full screen cleanly
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = cw / ch;

  let drawW, drawH, drawX, drawY;

  if (canvasAspect > imgAspect) {
    drawW = cw;
    drawH = cw / imgAspect;
    drawX = 0;
    drawY = (ch - drawH) / 2;
  } else {
    drawH = ch;
    drawW = ch * imgAspect;
    drawX = (cw - drawW) / 2;
    drawY = 0;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function getScrollProgress() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const maxScroll = Math.max(
    1,
    (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight
  );
  return Math.max(0, Math.min(1, scrollTop / maxScroll));
}

function updateTargetFrame() {
  const progress = getScrollProgress();
  targetFrameIndex = progress * (TOTAL_FRAMES - 1);
}

function preloadFrames() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    img.onload = () => {
      loadedCount++;
      const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      if (loaderText) loaderText.textContent = `Loading ${percent}%`;

      if (i === 0 || loadedCount === 1) {
        drawFrame(0);
      }

      if ((loadedCount >= 15 || loadedCount === TOTAL_FRAMES) && !isLoaded) {
        onInitialLoaded();
      }
    };

    img.onerror = () => {
      loadedCount++;
      if ((loadedCount >= 15 || loadedCount === TOTAL_FRAMES) && !isLoaded) {
        onInitialLoaded();
      }
    };

    images.push(img);
  }
}

function onInitialLoaded() {
  if (isLoaded) return;
  isLoaded = true;
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
  updateTargetFrame();
  currentFrameIndex = targetFrameIndex;
  drawFrame(Math.round(currentFrameIndex));
}

function renderLoop() {
  updateTargetFrame();

  const diff = targetFrameIndex - currentFrameIndex;
  if (Math.abs(diff) > 0.001) {
    currentFrameIndex += diff * 0.18; // Smooth LERP speed
  } else {
    currentFrameIndex = targetFrameIndex;
  }

  const frameToDraw = Math.min(
    TOTAL_FRAMES - 1,
    Math.max(0, Math.round(currentFrameIndex))
  );

  drawFrame(frameToDraw);
  requestAnimationFrame(renderLoop);
}

// Event Listeners
window.addEventListener('scroll', updateTargetFrame, { passive: true });
window.addEventListener('resize', () => {
  setupCanvasSize();
  drawFrame(Math.round(currentFrameIndex));
});

// Initialize canvas and start preloading
setupCanvasSize();
preloadFrames();
requestAnimationFrame(renderLoop);
