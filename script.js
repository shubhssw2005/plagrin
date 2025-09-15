const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview');
const mediaWrapper = document.getElementById('media-wrapper');
const dropzone2 = document.getElementById('dropzone2');
const fileInput2 = document.getElementById('file-input-2');
const titleStep2 = document.getElementById('title-step2');
const titleStep3 = document.getElementById('title-step3');
const resultSection = document.getElementById('result');
const verdictEl = document.getElementById('verdict');
const explanationEl = document.getElementById('explanation');
const pdfDropzone = document.getElementById('pdf-dropzone');
const pdfInput = document.getElementById('pdf-input');
const referenceSection = document.getElementById('reference');
const referenceTextEl = document.getElementById('reference-text');
const previewTitle = document.getElementById('preview-title');
const analysisTitle = document.getElementById('analysis-title');
const referenceTitle = document.getElementById('reference-title');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // ~50 MB
const MAX_PDF_PAGES = 15; // avoid heavy parsing
let referenceTextCache = '';

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
// Support all browse labels
document.querySelectorAll('.browse')?.forEach(label => {
    label.addEventListener('click', (e) => {
        const forId = label.getAttribute('for');
        const target = forId ? document.getElementById(forId) : null;
        (target || fileInput).click();
    });
});
fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
        handleFiles(fileInput.files);
    }
});

// Second image handlers
if (dropzone2) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone2.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone2.addEventListener(eventName, () => dropzone2.classList.add('dragover'));
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone2.addEventListener(eventName, () => dropzone2.classList.remove('dragover'));
    });
    dropzone2.addEventListener('drop', (e) => handleDrop(e, 2));
    dropzone2.addEventListener('click', () => fileInput2?.click());
}
fileInput2?.addEventListener('change', () => {
    if (fileInput2.files && fileInput2.files[0]) {
        handleFiles(fileInput2.files, 2);
    }
});

// PDF reference handlers
if (pdfDropzone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        pdfDropzone.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        pdfDropzone.addEventListener(eventName, () => pdfDropzone.classList.add('dragover'));
    });
    ['dragleave', 'drop'].forEach(eventName => {
        pdfDropzone.addEventListener(eventName, () => pdfDropzone.classList.remove('dragover'));
    });
    pdfDropzone.addEventListener('drop', (e) => handlePdfDrop(e, 1));
    pdfDropzone.addEventListener('click', () => pdfInput?.click());
}
pdfInput?.addEventListener('change', () => {
    if (pdfInput.files && pdfInput.files[0]) {
        handlePdfFile(pdfInput.files[0], 1);
    }
});

// Second PDF handlers
// (Second PDF removed in step-by-step flow)

function handleDrop(e, slot = 1) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files, slot);
}

function handleFiles(fileList, slot = 1) {
    const files = [...fileList];
    if (files.length === 0) return;
    const file = files[0];
    if (file.size > MAX_SIZE_BYTES) {
        showResult('warn', 'File too large', 'Please upload files up to ~50MB.');
        return;
    }
    if (slot === 1) {
        resetUI();
    }
    renderPreview(file, slot);
    analyzeFile(file, slot);
}

function resetUI() {
    previewSection.hidden = false;
    resultSection.hidden = false;
    if (previewTitle) previewTitle.hidden = false;
    if (analysisTitle) analysisTitle.hidden = false;
    verdictEl.className = 'verdict';
    verdictEl.textContent = 'Analyzing…';
    explanationEl.textContent = '';
    mediaWrapper.innerHTML = '';
}

function renderPreview(file, slot = 1) {
    const url = URL.createObjectURL(file);
    const card = document.createElement('div');
    card.className = 'media-card';
    const label = document.createElement('div');
    label.className = 'mini-verdict';
    label.textContent = `Media ${slot}`;
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Uploaded image preview ${slot}`;
        card.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.playsInline = true;
        card.appendChild(video);
    } else {
        card.textContent = 'Unsupported file type.';
    }
    card.appendChild(label);
    mediaWrapper.appendChild(card);
}

async function analyzeFile(file, slot = 1) {
    try {
        let verdictText = '';
        let explanationText = '';
        let tone = 'warn';
        if (file.type.startsWith('image/')) {
            // Heuristic analysis
            const heuristics = await analyzeImageHeuristics(file);
            // Sightengine backend
            let se = null;
            let sightengineDetails = '';
            try {
                se = await checkWithSightengine(file);
                // Extract relevant Sightengine fields for explanation
                if (se) {
                    sightengineDetails = '\n--- Sightengine Analysis ---\n';
                    if (se.status) sightengineDetails += `Status: ${se.status}\n`;
                    if (se.type) sightengineDetails += `Type: ${se.type}\n`;
                    if (se.ai && se.ai.generated !== undefined) {
                        sightengineDetails += `AI Generated Probability: ${se.ai.generated}\n`;
                    }
                    if (se.classes) {
                        sightengineDetails += `Classes: ${JSON.stringify(se.classes)}\n`;
                    }
                    if (se.moderation) {
                        sightengineDetails += `Moderation: ${JSON.stringify(se.moderation)}\n`;
                    }
                    if (se.error) sightengineDetails += `Error: ${se.error}\n`;
                }
            } catch (err) {
                sightengineDetails += 'Sightengine error: ' + (err.message || err);
            }
            // Merge results
            let finalScore = heuristics.score;
            let reasons = [...heuristics.reasons];
            if (se) {
                const merged = mergeSightengineResult(heuristics.score, reasons, se);
                finalScore = merged.score;
            }
            const percent = Math.round(finalScore * 100);
            const labelObj = scoreToLabel(finalScore);
            verdictText = `AI-generated probability: ${percent}% — ${labelObj.label}`;
            tone = labelObj.tone;
            explanationText = reasons.join('\n') + sightengineDetails;
            updateMiniVerdict(slot, tone, verdictText);
            showResult(tone, verdictText, explanationText);
        } else if (file.type.startsWith('video/')) {
            // Heuristic analysis for video
            const heuristics = await analyzeVideoHeuristics(file);
            const percent = Math.round(heuristics.score * 100);
            const labelObj = scoreToLabel(heuristics.score);
            verdictText = `AI-generated probability: ${percent}% — ${labelObj.label}`;
            tone = labelObj.tone;
            explanationText = heuristics.reasons.join('\n');
            updateMiniVerdict(slot, tone, verdictText);
            showResult(tone, verdictText, explanationText);
        } else {
            showResult('warn', 'Unsupported file type', 'Please upload an image or a video.');
        }
    } catch (err) {
        console.error(err);
        const msg = (err && err.message) ? err.message : 'An error occurred while analyzing the file.';
        showResult('warn', 'Analysis failed', msg);
    }
}

function updateMiniVerdict(slot, tone, text) {
    const cards = mediaWrapper.querySelectorAll('.media-card');
    const idx = Math.max(0, Math.min(cards.length - 1, slot - 1));
    const el = cards[idx]?.querySelector('.mini-verdict');
    if (el) {
        el.className = `mini-verdict ${tone}`;
        el.textContent = `${text}`;
    }
}

function showResult(tone, verdictText, explanationText) {
    verdictEl.className = `verdict ${tone}`;
    verdictEl.textContent = verdictText;
    explanationEl.textContent = explanationText;
    // Show main reason below analysis
    const mainReasonEl = document.getElementById('main-reason');
    let mainReason = '';
    if (explanationText) {
        // Pick the strongest reason (first line with 'AI' or 'authentic' or similar)
        const lines = explanationText.split(/\n|\r/).filter(l => l.trim());
        mainReason = lines.find(l => /AI|generator|authentic|dimension|metadata|diffusion|deepfake|human|camera/i.test(l)) || lines[0] || '';
    }
    mainReasonEl.textContent = mainReason ? `Reason: ${mainReason}` : '';
}

function scoreToLabel(score) {
    if (score >= 0.7) return { label: 'Likely AI-generated', tone: 'bad' };
    if (score >= 0.4) return { label: 'Inconclusive / Mixed signals', tone: 'warn' };
    return { label: 'Likely human-captured', tone: 'ok' };
}

function sightengineToVerdict(seData) {
    // Extract AI probability from Sightengine response and map to label/tone
    let aiConfidence;
    try {
        const flat = JSON.stringify(seData).toLowerCase();
        const match = flat.match(/(ai[-_ ]?generated)[^0-9]{1,20}([0-1]?(?:\.[0-9]+)?)/);
        if (match && match[2]) aiConfidence = parseFloat(match[2]);
        if (!isFinite(aiConfidence)) {
            const candidates = [];
            traverseNumbers(seData, (path, val) => {
                if (path.join('.').toLowerCase().includes('ai') && val >= 0 && val <= 1) candidates.push(val);
            });
            if (candidates.length) aiConfidence = Math.max(...candidates);
        }
    } catch (_) { }
    if (!isFinite(aiConfidence)) aiConfidence = 0.5;
    const { label, tone } = scoreToLabel(aiConfidence);
    const details = 'Sightengine analysis used.';
    return { score: aiConfidence, label, tone, details };
}

// ----- Sightengine integration (images only) -----
async function checkWithSightengine(file) {
    const endpoint = (window.SE_BACKEND || '').replace(/\/$/, '') || '';
    const url = `${endpoint}/api/check-image`;
    const form = new FormData();
    form.append('media', file, file.name || 'upload');
    const resp = await fetch(url, { method: 'POST', body: form });
    const contentType = resp.headers.get('content-type') || '';
    if (!resp.ok) {
        let errText = 'Sightengine request failed';
        try { errText = await resp.text(); } catch (_) { }
        throw new Error(errText);
    }
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text();
    return data;
}

function mergeSightengineResult(currentScore, reasons, seData) {
    // seData format depends on selected models; for ai-generated, expect something like data.ai.generated or classes
    // We will look for any key containing 'ai' and a confidence number, then adjust score accordingly.
    let aiConfidence = undefined;
    try {
        // Common shape: data.type === 'ai-generated', data.status === 'success', data.ai?.generated?.prob
        if (seData && typeof seData === 'object') {
            // Heuristic extraction across possible structures
            const flat = JSON.stringify(seData).toLowerCase();
            const match = flat.match(/(ai[-_ ]?generated)[^0-9]{1,20}([0-1]?(?:\.[0-9]+)?)/);
            if (match && match[2]) {
                aiConfidence = parseFloat(match[2]);
            }
            // Some responses return predictions as numbers 0..1 per class
            if (!isFinite(aiConfidence)) {
                const candidates = [];
                traverseNumbers(seData, (path, val) => {
                    if (path.join('.').toLowerCase().includes('ai') && val >= 0 && val <= 1) {
                        candidates.push(val);
                    }
                });
                if (candidates.length) aiConfidence = Math.max(...candidates);
            }
        }
    } catch (_) { }

    if (isFinite(aiConfidence)) {
        // Blend: weight Sightengine 70%, heuristic 30%
        const blended = 0.7 * aiConfidence + 0.3 * currentScore;
        reasons.push(`Sightengine confidence suggests AI at ${(aiConfidence * 100).toFixed(1)}%.`);
        return { score: Math.max(0, Math.min(1, blended)) };
    } else {
        reasons.push('Sightengine response received but no AI confidence extracted.');
    }
    return { score: currentScore };
}

function traverseNumbers(obj, cb, path = []) {
    if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            const nextPath = path.concat([key]);
            if (val && typeof val === 'object') traverseNumbers(val, cb, nextPath);
            else if (typeof val === 'number') cb(nextPath, val);
        }
    }
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
    } catch (_) { }

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
    } catch (_) { }

    // Clamp score to [0,1]
    applyReferenceInfluence(reasons, (delta) => { score += delta; });
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
    } catch (_) { }

    // Basic duration/frames heuristic via HTMLVideoElement
    try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.src = url;
        await video.play().catch(() => { });
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
    } catch (_) { }

    applyReferenceInfluence(reasons, (delta) => { score += delta; });
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

// ----- PDF Reference Support -----
function handlePdfDrop(e, slot = 1) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (!files || !files[0]) return;
    handlePdfFile(files[0], slot);
}

async function handlePdfFile(file, slot = 1) {
    if (!file || file.type !== 'application/pdf') return;
    if (file.size > MAX_SIZE_BYTES) {
        referenceSection.hidden = false;
        if (referenceTitle) referenceTitle.hidden = false;
        if (referenceTextEl) referenceTextEl.textContent = 'PDF too large. Please upload up to ~50MB.';
        return;
    }
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
        let textContent = '';
        for (let p = 1; p <= pageCount; p++) {
            const page = await pdf.getPage(p);
            const text = await page.getTextContent();
            const pageText = text.items.map(i => i.str).join(' ');
            textContent += '\n' + pageText;
            if (textContent.length > 20000) break; // cap
        }
        const cleaned = normalizeWhitespace(textContent).slice(0, 20000);
        referenceTextCache = cleaned;
        referenceSection.hidden = false;
        if (referenceTitle) referenceTitle.hidden = false;
        if (referenceTextEl) referenceTextEl.textContent = cleaned.slice(0, 800) + (cleaned.length > 800 ? '…' : '');
    } catch (err) {
        console.error(err);
        referenceSection.hidden = false;
        if (referenceTitle) referenceTitle.hidden = false;
        if (referenceTextEl) referenceTextEl.textContent = 'Failed to parse PDF.';
    }
}

function normalizeWhitespace(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
}

function applyReferenceInfluence(reasons, addScore) {
    if (!referenceTextCache) return;
    const ref = referenceTextCache.toLowerCase();
    const aiKeywords = [
        'ai-generated', 'ai generated', 'synthetic image', 'deepfake', 'manipulated',
        'fabricated', 'composite', 'diffusion', 'midjourney', 'stable diffusion', 'dall-e', 'sdxl', 'firefly'
    ];
    const authenticityKeywords = [
        'authentic', 'original photo', 'camera metadata', 'exif', 'provenance', 'c2pa'
    ];
    let hitsAI = 0, hitsAuth = 0;
    aiKeywords.forEach(k => { if (ref.includes(k)) hitsAI++; });
    authenticityKeywords.forEach(k => { if (ref.includes(k)) hitsAuth++; });
    if (hitsAI > 0) {
        reasons.push('Reference mentions AI-generation indicators.');
        addScore(Math.min(0.15, 0.05 * hitsAI));
    }
    if (hitsAuth > 0) {
        reasons.push('Reference mentions authenticity indicators.');
        addScore(-Math.min(0.15, 0.05 * hitsAuth));
    }
}


