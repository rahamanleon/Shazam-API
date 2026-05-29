# Shazam-API 🎵 — API Reference

> RESTful API wrapper for audio recognition.  
> Upload audio → get back song metadata.

---

## 🔌 Endpoints

### `POST /recognize`

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

Health check for Render zero-downtime deploys.

```json
{ "status": "healthy", "timestamp": "2026-05-29T12:00:00.000Z" }
```

### `GET /`

API information + available endpoints.

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

1. Click the button above
2. Render auto-detects `render.yaml`
3. Deploys in ~2 minutes

### Manual Setup
| Setting | Value |
|---------|-------|
| Runtime | **Node** |
| Build Command | `npm install` |
| Start Command | `node api-server.js` |
| Health Check | `/health` |
| Plan | **Free** |

### 🆓 Free Tier Limits
| Resource | Limit |
|----------|-------|
| RAM | 512 MB |
| CPU | 0.1 vCPU |
| Bandwidth | 100 GB / month |
| Idle Sleep | After 15 min |
| Max Upload | 25 MB |

---

## 🧠 Architecture

```
Client → POST /recognize
          ↓
   api-server.js (Express + multer)
          ↓
   ST.js (recognizeSong)
     ├── fetchToken() → Shazam auth
     ├── processAudio() → FFmpeg → 16 kHz mono PCM
     ├── SignatureGenerator → FFT fingerprint
     └── POST amp.shazam.com → match
          ↓
   JSON response ← Client
```

---

## 👨‍💻 Author

**Rahaman Leon** — [@rahamanleon](https://github.com/rahamanleon)

---

## 📄 License

MIT — free for personal and commercial use.
