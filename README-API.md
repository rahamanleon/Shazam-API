# Shazam-API 🎵 — API Reference

> RESTful API wrapper for ST-Shazam audio recognition.  
> Upload audio → get back song metadata.

**Live URL**: Deploy on Render via Blueprint (see below)

---

## 🔌 Endpoints

### `POST /recognize`

Identify a song from an audio file.

**Request**: `multipart/form-data` — field name: `audio`

| Field | Type | Required | Max | Description |
|-------|------|----------|-----|-------------|
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
    "releaseDate": "2020-03-20",
    "label": "Republic Records",
    "image": "https://...coverart.jpg",
    "url": "https://www.shazam.com/track/123",
    "shazamId": "123456789"
  }
}
```

**⚠️ No Match (200):**
```json
{
  "success": false,
  "message": "No matches found for this audio"
}
```

**❌ Error (400/500):**
```json
{
  "error": "No audio file provided",
  "detail": "Error message here"
}
```

---

### `GET /health`

Health check for Render zero-downtime deploys.

```json
{
  "status": "healthy",
  "timestamp": "2026-05-29T12:00:00.000Z"
}
```

---

### `GET /`

Returns API info and available endpoints.

---

## 💻 Usage Examples

### cURL
```bash
curl -F "audio=@song.mp3" https://your-app.onrender.com/recognize
```

### Python
```python
import requests
url = "https://your-app.onrender.com/recognize"
files = {"audio": open("song.mp3", "rb")}
resp = requests.post(url, files=files)
print(resp.json())
```

### Node.js
```javascript
import FormData from 'form-data';
import { createReadStream } from 'fs';
import axios from 'axios';

const form = new FormData();
form.append('audio', createReadStream('song.mp3'));

const { data } = await axios.post(
  'https://your-app.onrender.com/recognize',
  form,
  { headers: form.getHeaders() }
);
console.log(data);
```

---

## ☁️ Deploy on Render (Free Tier)

### One-Click Blueprint
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprint/new?repo=https://github.com/rahamanleon/Shazam-API)

### What You Get
| Resource | Free Tier |
|----------|-----------|
| RAM | 512 MB |
| CPU | 0.1 vCPU (shared) |
| Hours | 750 / month |
| Bandwidth | 100 GB / month |
| Storage | Ephemeral (uploads deleted after request) |
| Max Upload | 25 MB |
| Idle Sleep | After 15 min (~30s cold start) |

---

## 🧠 Architecture

```
Client → POST /recognize
          ↓
   api-server.js (Express + multer)
          ↓
   ST.js (recognizeSong)
     ├── fetchToken() → Shazam auth
     ├── processAudio() → FFmpeg → 16kHz mono PCM
     ├── SignatureGenerator → FFT fingerprint
     └── POST amp.shazam.com → match
          ↓
   JSON response ← Client
```

The API wrapper is minimal glue — core fingerprinting logic in `ST.js`, `src/algorithm.js`, and `src/signature-format.js` is used untouched.

---

## 📦 Dependencies

| Package | Role |
|---------|------|
| `express` | HTTP server |
| `multer` | File upload handling |
| `cors` | Cross-origin support |
| `axios` | Shazam API client |
| `fluent-ffmpeg` | Audio conversion |
| `@ffmpeg-installer/ffmpeg` | Bundled FFmpeg |
| `fft.js` | Fast Fourier Transform |
| `uuid` | Device/session IDs |

---

## 👨‍💻 Author

**Rahaman Leon** — [@rahamanleon](https://github.com/rahamanleon)

---

## 📄 License

MIT — free for personal and commercial use.
