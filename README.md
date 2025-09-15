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
