# Shazam-API 🎵

> A production-ready RESTful API for audio recognition — upload a song clip, get back title, artist, album & artwork.  
> Powered by acoustic fingerprinting matched against Shazam's database.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy on Render](https://img.shields.io/badge/Deploy%20on-Render-46E3B7?logo=render)](https://render.com)

---

## ✨ Features

- **🎤 Song Recognition** — Upload any audio file, get song metadata in seconds
- **📡 RESTful API** — Simple `POST /recognize` endpoint, JSON response
- **🔊 Any Format** — MP3, WAV, M4A, FLAC, OGG, AAC — FFmpeg handles conversion
- **☁️ Deploy Anywhere** — Works locally or deploy to Render free tier in minutes
- **🔌 No External DB** — Stateless, just the API + Shazam matching

---

## 🚀 Quick Start

```bash
git clone https://github.com/rahamanleon/Shazam-API.git
cd Shazam-API
npm install
node api-server.js
```

```bash
curl -X POST http://localhost:3000/recognize \
  -F "audio=@/path/to/song.mp3"
```

```json
{
  "success": true,
  "data": {
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "After Hours",
    "genre": "Pop",
    "artwork": "https://...",
    "matches": [...]
  }
}
```

---

## 📚 API Reference

### `POST /recognize`

| Field | Type | Required | Max Size | Description |
|-------|------|----------|----------|-------------|
| `audio` | File | ✅ | 25 MB | MP3, WAV, M4A, FLAC, OGG, AAC, WMA |

**✅ Success (200):**
```json
{
  "success": true,
  "song": {
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "After Hours",
    "genre": "R&B/Soul",
    "image": "https://...coverart.jpg",
    "url": "https://www.shazam.com/track/123"
  }
}
```

**⚠️ No Match (200):**
```json
{ "success": false, "message": "No matches found for this audio" }
```

**❌ Error (400/500):**
```json
{ "error": "No audio file provided", "detail": "..." }
```

### `GET /health`

```json
{ "status": "healthy", "timestamp": "2026-05-29T12:00:00.000Z" }
```

### `GET /`

API information + available endpoints.

---

## ☁️ Deploy on Render (Free Tier)

Choose **one** of these methods:

### Method 1 — One-Click Blueprint (Easiest) 🚀

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprint/new?repo=https://github.com/rahamanleon/Shazam-API)

Click the button above — Render will:
1. Fork the repo automatically
2. Read `render.yaml` from the root
3. Build & deploy in ~2 minutes
4. Your API is live at `https://shazam-api.onrender.com`

### Method 2 — Manual via Dashboard 🖥️

1. **Push to GitHub** — Make sure your repo is on GitHub
2. **Login** → [dashboard.render.com](https://dashboard.render.com)
3. **New Web Service** → Connect your GitHub repo
4. **Configure**:
   | Setting | Value |
   |---------|-------|
   | Runtime | **Node** |
   | Build Command | `npm install` |
   | Start Command | `node api-server.js` |
   | Plan | **Free** |
5. **Advanced** → Set Health Check Path to `/health`
6. **Create Web Service** ✅

### Method 3 — Render CLI ⚡

```bash
# Install Render CLI
curl -fsSL https://cli.render.com/install.sh | sh

# Authenticate
render login

# Deploy from your local directory
render blueprint apply
```

### 🆓 Free Tier Limits

| Resource | Limit |
|----------|-------|
| RAM | 512 MB |
| CPU | 0.1 vCPU (shared) |
| Bandwidth | 100 GB / month |
| Uptime | 750 hours / month |
| Idle Sleep | After 15 min (~30s cold start) |
| Max Upload | 25 MB |

> **Tip**: Use a monitoring service like [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 10 min to prevent your service from sleeping.

### ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `MAX_FILE_SIZE` | `25MB` | Max upload size |

---

## 🧪 CLI Usage (Without Server)

```bash
node ST.js ./audio.mp3
```

Or as a module in your own code:

```javascript
const { recognizeSong } = require('./index.js');
const result = await recognizeSong('./song.mp3');
console.log(result.matches[0]?.track?.title);
```

---

## 🏗️ Project Structure

```
Shazam-API/
├── api-server.js          # Express REST API (entry point for deploy)
├── ST.js                  # Core recognition engine (CLI)
├── index.js               # Module exports
├── render.yaml            # Render Blueprint config
├── src/
│   ├── algorithm.js       # FFT + peak detection → fingerprint
│   ├── signature-format.js # Signature encode/decode
│   └── hanning.js         # Hanning window function
├── package.json
└── README.md
```

---

## ⚙️ How It Works

```
Audio File → FFmpeg (16 kHz mono PCM) → FFT Fingerprint → Shazam API → Song Metadata
```

1. **Decode** — FFmpeg converts to 16 kHz mono PCM
2. **Fingerprint** — FFT + peak detection creates a unique acoustic signature
3. **Match** — Signature is sent to Shazam's API for lookup
4. **Result** — Returns song title, artist, album, artwork

---

## 📦 Dependencies

| Package | Role |
|---------|------|
| `express` | HTTP server & routing |
| `multer` | Multipart file upload handling |
| `cors` | Cross-origin requests |
| `axios` | HTTP client for Shazam API |
| `fluent-ffmpeg` | Audio format conversion |
| `@ffmpeg-installer/ffmpeg` | Bundled FFmpeg binary |
| `fft.js` | Fast Fourier Transform |
| `uuid` | Device/session ID generation |

---

## 👨‍💻 Author

**Rahaman Leon** — [@rahamanleon](https://github.com/rahamanleon)

---

## 📄 License

MIT — free for personal and commercial use.

---

## 🤝 Contributing

Issues, PRs, and feature requests welcome!  
[Open an issue](https://github.com/rahamanleon/Shazam-API/issues)

---

Made with ❤️ and 🎶 by Rahaman Leon
