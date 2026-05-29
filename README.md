# Shazam-API 🎵

> A production-ready RESTful API wrapper for ST-Shazam audio recognition — identify songs from audio files with ease.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy on Render](https://img.shields.io/badge/Deploy%20on-Render-46E3B7?logo=render)](https://render.com)

---

## ✨ What It Does

Upload an audio file → get back song metadata (title, artist, album, artwork).  
Powered by acoustic fingerprinting via ST-Shazam matched against Shazam's database.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/rahamanleon/Shazam-API.git
cd Shazam-API
npm install
```

### 2. Start the Server

```bash
node api-server.js
```

The API will be live at **http://localhost:3000**.

### 3. Recognize a Song

```bash
curl -X POST http://localhost:3000/recognize \
  -F "audio=@/path/to/your/song.mp3"
```

#### Response

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
  },
  "meta": {
    "duration": "0:32",
    "fingerprint": "8a3f7c..."
  }
}
```

---

## 📚 API Reference

### `POST /recognize`

Recognize a song from an audio file.

| Parameter | Type | Description |
|-----------|------|-------------|
| `audio` | File | Audio file (MP3, WAV, M4A, FLAC, etc.) — multipart form field |

**Success (200):**
```json
{
  "success": true,
  "data": {
    "title": "Song Title",
    "artist": "Artist Name",
    "subtitle": "Featured Artist",
    "album": "Album Name",
    "genre": "Genre",
    "artwork": "https://...",
    "matches": [...]
  }
}
```

**Error (400/500):**
```json
{
  "success": false,
  "error": "No audio file provided"
}
```

### `GET /health`

Health check endpoint (useful for deployment monitoring).

```json
{
  "status": "ok",
  "timestamp": "2026-05-29T14:00:00Z",
  "uptime": 12345
}
```

### `GET /`

Returns API information and available endpoints.

---

## 🧪 CLI Usage (Direct)

You can also use the core module directly without the API server:

```bash
node ST.js ./audio.mp3
```

Or in your own code:

```javascript
const { recognizeSong } = require('./index.js');

const result = await recognizeSong('./song.mp3');
console.log(result.matches[0]?.track?.title);
```

---

## 🏗️ Project Structure

```
Shazam-API/
├── api-server.js          # Express REST API server
├── ST.js                  # Core ST-Shazam CLI tool
├── index.js               # Module exports
├── src/
│   ├── algorithm.js       # Fingerprint generation (FFT + peaks)
│   ├── signature-format.js # Signature encoding/decoding
│   └── hanning.js         # Hanning window function
├── package.json
├── render.yaml            # Render Blueprint config
└── README.md              # You are here
```

---

## ☁️ Deploy on Render

One-click deploy with the Render Blueprint:

1. Fork or push to your GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New Blueprint**
3. Connect your repo → Render auto-detects `render.yaml`

Or use the deeplink:  
`https://render.com/deploy?repo=https://github.com/rahamanleon/Shazam-API`

> **Free tier**: 512 MB RAM, sleeps after 15 min idle. Wakes on request.

---

## ⚙️ How It Works

```
Audio File → FFmpeg (16 kHz mono PCM) → FFT Fingerprinting → Shazam API → Song Metadata
```

1. **Audio Processing** — Converts input to 16 kHz mono PCM via FFmpeg
2. **Fingerprinting** — FFT + peak detection generates a unique acoustic signature
3. **Matching** — Fingerprint is sent to Shazam's API for lookup
4. **Result** — Returns matched song metadata (title, artist, album, artwork)

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server & routing |
| `multer` | Multipart file upload handling |
| `cors` | Cross-origin requests |
| `axios` | HTTP client for Shazam API |
| `fluent-ffmpeg` | Audio conversion |
| `@ffmpeg-installer/ffmpeg` | Bundled FFmpeg binary |
| `fft.js` | Fast Fourier Transform |
| `uuid` | Device/session ID generation |

---

## 🛠️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `MAX_FILE_SIZE` | `25MB` | Max upload size |

---

## 👨‍💻 Author

**Rahaman Leon** — [@rahamanleon](https://github.com/rahamanleon)

---

## 📄 License

MIT — use it freely for personal or commercial projects.

---

## 🤝 Contributing

Issues, PRs, and feature requests welcome!  
[Open an issue](https://github.com/rahamanleon/Shazam-API/issues)

---

Made with ❤️ and 🎶 by Rahaman Leon
