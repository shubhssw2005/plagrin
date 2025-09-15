const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview');
const mediaWrapper = document.getElementById('media-wrapper');
const resultSection = document.getElementById('result');
const verdictEl = document.getElementById('verdict');
const explanationEl = document.getElementById('explanation');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // ~50 MB

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'));
});
['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'));
});

dropzone.addEventListener('drop', handleDrop);
dropzone.addEventListener('click', () => fileInput.click());
document.querySelector('.browse')?.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files[0]) {
    handleFiles(fileInput.files);
  }
});

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFiles(fileList) {
  const files = [...fileList];
  if (files.length === 0) return;
  const file = files[0];
  if (file.size > MAX_SIZE_BYTES) {
    showResult('warn', 'File too large', 'Please upload files up to ~50MB.');
    return;
  }
  resetUI();
  renderPreview(file);
  analyzeFile(file);
}

function resetUI() {
  previewSection.hidden = false;
  resultSection.hidden = false;
  verdictEl.className = 'verdict';
  verdictEl.textContent = 'Analyzing…';
  explanationEl.textContent = '';
  mediaWrapper.innerHTML = '';
}

function renderPreview(file) {
  const url = URL.createObjectURL(file);
  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Uploaded image preview';
    mediaWrapper.appendChild(img);
  } else if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    mediaWrapper.appendChild(video);
  } else {
    mediaWrapper.textContent = 'Unsupported file type.';
  }
}

async function analyzeFile(file) {
  try {
    if (file.type.startsWith('image/')) {
      const { score, reasons } = await analyzeImageHeuristics(file);
      const { label, tone } = scoreToLabel(score);
      showResult(tone, label, reasons.join(' '));
    } else if (file.type.startsWith('video/')) {
      const { score, reasons } = await analyzeVideoHeuristics(file);
      const { label, tone } = scoreToLabel(score);
      showResult(tone, label, reasons.join(' '));
    } else {
      showResult('warn', 'Unsupported file type', 'Please upload an image or a video.');
    }
  } catch (err) {
    console.error(err);
    showResult('warn', 'Analysis failed', 'An error occurred while analyzing the file.');
  }
}

function showResult(tone, verdictText, explanationText) {
  verdictEl.className = `verdict ${tone}`;
  verdictEl.textContent = verdictText;
  explanationEl.textContent = explanationText;
}

function scoreToLabel(score) {
  if (score >= 0.7) return { label: 'Likely AI-generated', tone: 'bad' };
  if (score >= 0.4) return { label: 'Inconclusive / Mixed signals', tone: 'warn' };
  return { label: 'Likely human-captured', tone: 'ok' };
}

async function analyzeImageHeuristics(file) {
  const reasons = [];
  let score = 0.5; // start neutral

  // 1) Check EXIF/XMP metadata for common generator tags
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const textHint = sniffText(bytes, 0, Math.min(bytes.length, 1_000_000));
    const generatorHits = /(Stable Diffusion|Midjourney|DALL-E|DALLE|NovelAI|Automatic1111|ComfyUI|Meta AI|Adobe Firefly|SDXL|Real-ESRGAN|waifu2x|GFPGAN)/i;
    if (generatorHits.test(textHint)) {
      reasons.push('Metadata hint: generator tag detected.');
      score += 0.35;
    }

    // 2) Look for C2PA Content Credentials
    if (/c2pa|ContentCredentials|ClaimSignature|Adobe\.com\/c2pa/i.test(textHint)) {
      reasons.push('Content Credentials (C2PA) metadata present.');
      // Presence of C2PA itself is neutral; signed claims can indicate edits or AI.
      score += 0.05;
    }

    // 3) JPEG quantization table and compression artifacts heuristic (very rough)
    if (file.type === 'image/jpeg') {
      const hasJfif = /JFIF/i.test(textHint);
      const hasExif = /Exif/i.test(textHint);
      if (!hasJfif && !hasExif) {
        reasons.push('JPEG without standard JFIF/EXIF markers (unusual).');
        score += 0.15;
      }
    }
  } catch (_) {}

  // 4) Dimension sanity check (some generators use round numbers)
  try {
    const imgBitmap = await createImageBitmap(file);
    const { width, height } = imgBitmap;
    if ([512, 768, 1024, 1536].includes(width) || [512, 768, 1024, 1536].includes(height)) {
      reasons.push('Common AI generation dimension detected.');
      score += 0.1;
    }
    if (width % 64 === 0 && height % 64 === 0) {
      reasons.push('Both dimensions are multiples of 64, common for diffusion models.');
      score += 0.1;
    }
  } catch (_) {}

  // Clamp score to [0,1]
  score = Math.max(0, Math.min(1, score));
  if (reasons.length === 0) reasons.push('No strong indicators found.');
  return { score, reasons };
}

async function analyzeVideoHeuristics(file) {
  const reasons = [];
  let score = 0.5; // neutral

  // Parse container-level text for hints
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer.slice(0, 2_000_000));
    const textHint = sniffText(bytes, 0, bytes.length);
    if (/(Gen-\d|Sora|Runway|Pika|Kaiber|Gen-2|AnimateDiff|Deforum|Stability AI)/i.test(textHint)) {
      reasons.push('Container/metadata references AI video tools.');
      score += 0.3;
    }
    if (/(Lavf|ffmpeg)/i.test(textHint)) {
      reasons.push('Encoded via FFmpeg (common both for edits and generations).');
      score += 0.05;
    }
  } catch (_) {}

  // Basic duration/frames heuristic via HTMLVideoElement
  try {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    await video.play().catch(() => {});
    await new Promise(resolve => {
      if (video.readyState >= 2) return resolve();
      video.onloadedmetadata = () => resolve();
      setTimeout(resolve, 1500);
    });
    const w = video.videoWidth, h = video.videoHeight;
    if (w % 64 === 0 && h % 64 === 0) {
      reasons.push('Both video dimensions multiples of 64 (typical model constraint).');
      score += 0.1;
    }
  } catch (_) {}

  score = Math.max(0, Math.min(1, score));
  if (reasons.length === 0) reasons.push('No strong indicators found.');
  return { score, reasons };
}

function sniffText(bytes, start, end) {
  const slice = bytes.subarray(start, end);
  let result = '';
  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 126)) {
      result += String.fromCharCode(c);
    } else {
      result += '\u0000';
    }
  }
  return result;
}


