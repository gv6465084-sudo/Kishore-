# TruthScan AI — Free-Tier Digital Content Verification Platform

**Tagline:** Verify the Content. Reveal the Evidence. Protect the Truth.

TruthScan AI is a zero-paid-dependency, privacy-first digital verification platform supporting:
- **NewsCheck:** English & Tamil claim segmentation, local sensationalism/unsupported-number heuristics, user-provided reference URL cross-checking, optional Google Fact Check Tools API, and Gemini free-tier explanation.
- **ImageCheck:** Magic-byte validation (`JPG`, `JPEG`, `PNG`, `WebP`), EXIF metadata inspection, compression density analysis, Error Level Analysis (ELA) heatmap comparison, and optional Gemini free-tier visual review.
- **VideoCheck:** FFprobe stream inspection, FFmpeg timestamped frame extraction, contact sheet stitching, frame-to-frame luminance consistency comparison, and optional Gemini free-tier frame analysis. Specialised deepfake detection is explicitly marked unconfigured in Free Mode rather than generating fake scores.

## Zero Mandatory Paid Dependencies
- **No Hugging Face API token or paid endpoints required.**
- **No Firebase, MongoDB, PostgreSQL, or paid cloud object storage required.**
- **No billing account or credit card required:** Uses local Node/Python forensic processing + Google AI Studio free-tier Gemini (`gemini-4-hydrogen`), and degrades gracefully to local analysis (`Inconclusive` / `Suspicious` where appropriate) if `GEMINI_API_KEY` is missing or hits free-tier rate limits (`429` / `503`).
- `GOOGLE_FACT_CHECK_API_KEY` is completely **optional**.

## Privacy-First Ephemeral Architecture
- Uploaded media and user submissions are processed in memory and isolated temporary directories that are deleted inside `finally` blocks after every request—including when errors occur.
- No database or permanent scan history exists on the server.
- Content submitted to hosted free-tier AI APIs (Google Gemini / Search Grounding / optional Fact Check Tools) is subject to those providers' published data-handling policies.

## Local Development (Google AI Studio / Node Port 3000)

```bash
npm install
cp .env.example .env
# Optional: set GEMINI_API_KEY in .env (automatically injected in Google AI Studio)
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints
- `GET /health` — Free-mode capability diagnostics (`gemini_configured`, `fact_check_api_configured`, `local_forensics_available`, `ffmpeg_available`)
- `POST /api/news/analyze` — Local heuristics + optional user `evidence_urls` + optional Fact Check API + Gemini free tier
- `POST /api/image/analyze` — EXIF, dimensions/bpp, ELA heatmap, and optional Gemini visual inspection
- `POST /api/video/analyze` — FFprobe + FFmpeg frame extraction, frame consistency delta, contact sheet, and track separation
- `POST /api/report/pdf` | `/api/report/json` | `/api/report/markdown` — On-demand report exports
- `GET /api/config/languages` | `GET /api/config/modules`

## Free-Tier Deployment Guide

### 1. Google AI Studio Preview
- Runs directly with automatic `GEMINI_API_KEY` and `APP_URL` injection on port `3000`.

### 2. Free Full-Stack Hosting on Netlify (`netlify.toml` + Netlify Functions)
1. Push this repository to GitHub (or deploy directly with `npx netlify-cli deploy --prod`).
2. Netlify automatically reads `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions` (`/api/*` and `/health` automatically route to the serverless API function).
3. Add `GEMINI_API_KEY` (from Google AI Studio free tier) in **Netlify Site Configuration → Environment variables**. (`GOOGLE_FACT_CHECK_API_KEY` is optional.)

### 3. Free Container Backend Hosting (Render Free Web Service / Docker)
1. Deploy the repository on Render Free Web Service using the included `Dockerfile` (Python 3.11 + `ffmpeg` + OpenCV + Pillow).
2. Add `GEMINI_API_KEY` (free tier from Google AI Studio) as an environment variable. No Hugging Face or billing keys needed.
3. If hosting frontend and backend separately, set `VITE_API_BASE_URL` on the frontend; CORS automatically allows localhost, `*.vercel.app`, `*.onrender.com`, `*.pages.dev`, `*.netlify.app`, and `*.run.app`.

### Known Free-Tier Limitations & Quotas
- **Render Free Web Services** spin down after ~15 minutes of inactivity, causing a 30–60 second cold start on the first request.
- **Gemini Free Tier** enforces requests-per-minute (RPM) and daily Search Grounding quotas (`429` / `503`). When limits occur or no API key is present, TruthScan AI automatically continues with local forensics and returns an honest `Inconclusive` status rather than fabricating AI answers.
- **Specialised Deepfake / Synthetic-Image Classifiers** are omitted in Free Mode and clearly marked unavailable.
