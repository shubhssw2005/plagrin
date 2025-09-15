# ai-detector

Drag-and-drop web app to heuristically assess whether an image or video might be AI-generated.

Important: This is a client-side, heuristic-only demo. It can be wrong. For authoritative provenance, rely on Content Credentials (C2PA) or trusted sources.

## Features

- Drag-and-drop or browse to upload
- Image and video previews
- Heuristic analysis:
  - Looks for generator names in metadata bytes (e.g., Stable Diffusion, Midjourney)
  - Detects presence of C2PA-related strings
  - Checks common diffusion-model dimensions (multiples of 64)
  - Basic JPEG marker sanity hints
  - Basic video container text sniff and dimension check
- No server required (static site)

### PDF-assisted verification (optional)

- Upload a supporting PDF (e.g., a news report or fact-check) to provide context.
- The app extracts text client-side via PDF.js and adjusts the explanation slightly if the PDF mentions AI-generation or authenticity terms.
- This does NOT guarantee correctness; it only surfaces relevant mentions from the reference.

## Getting started

Open `index.html` in a modern browser, or use a simple static server:

```bash
# macOS/Linux
python3 -m http.server 5173
# then open http://localhost:5173
```

## Deploy to GitHub Pages

1. Create a repo and push this folder.
2. In GitHub: Settings → Pages → Build and deployment → Source: Deploy from a branch.
3. Select branch (e.g., `main`) and root folder `/`.
4. Save. Your site will publish at `https://<username>.github.io/<repo>/`.

## Limitations

- Heuristics are not definitive. Both false positives and false negatives are possible.
- Many AI tools strip or randomize metadata; human-taken media can be heavily edited.
- Video support is best-effort and limited by browser parsing.
- Files larger than ~50MB are rejected to preserve browser memory.

## License

MIT

## Sightengine integration (optional)

For stronger checks, you can enable Sightengine image analysis via a small Node proxy (to keep secrets safe).

1) Create `.env` next to `server.js`:

```
SIGHTENGINE_API_USER=your_api_user
SIGHTENGINE_API_SECRET=your_api_secret
# Optional
SIGHTENGINE_MODELS=ai-generated
CORS_ORIGIN=http://localhost:5173
PORT=8787
```

2) Install and run the backend:

```bash
npm install
npm run dev
# Backend listens on http://localhost:8787
```

3) Open the site (e.g., with `python3 -m http.server 5173`) and upload an image; the app will call `/api/check-image` automatically.

Notes:
- Do not expose your API secret in the browser. Keep the proxy.
- GitHub Pages cannot run the backend; deploy the proxy separately (e.g., Render, Railway, Fly.io, Vercel functions, Cloud Run) and set CORS accordingly.
