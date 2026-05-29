# Shazam-API 🎵

A production-ready RESTful API wrapper for ST-Shazam audio recognition. Upload an audio file and get back song metadata (title, artist, album, genre, etc.) identified via Shazam's fingerprinting technology.

**Live Demo**: Deploy to Render using the Blueprint below.

---

## Quick Start

```bash
# Clone
git clone https://github.com/rahamanleon/Shazam-API.git
cd Shazam-API

# Install
npm install

# Start server
node api-server.js

# Test
curl -F "audio=@test.mp3" http://localhost:3000/recognize
```

## API Endpoints

### POST `/recognize`
Upload an audio file to identify a song.

**Request**: `multipart/form-data` with field name `audio`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | ✅ | Audio file (mp3, wav, ogg, flac, aac, m4a, wma, webm). Max 25 MB. |

**Success Response (200)**:
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

**No Match Response (200)**:
```json
{
  "success": false,
  "message": "No matches found for this audio"
}
```

**Error Response (400/500)**:
```json
{
  "error": "Recognition failed",
  "detail": "Error message here"
}
```

### GET `/health`
Health check endpoint for Render zero-downtime deploys.

```json
{
  "status": "healthy",
  "timestamp": "2026-05-29T12:00:00.000Z"
}
```

### GET `/`
API information.

## Usage Examples

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
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('audio', fs.createReadStream('song.mp3'));

const resp = await axios.post('https://your-app.onrender.com/recognize', form, {
  headers: form.getHeaders()
});
console.log(resp.data);
```

## Deploy to Render (Free Tier)

### One-Click Blueprint

1. Fork/push this repo to your GitHub/GitLab account
2. Click: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprint/new?repo=https://github.com/rahamanleon/Shazam-API)
3. Fill in any secret env vars
4. Click **Apply**

### Manual render.yaml

The included `render.yaml` configures:
- **Plan**: Free (512 MB RAM, 0.1 CPU)
- **Region**: Oregon
- **Health Check**: `/health`
- **Build**: `npm install`
- **Start**: `node api-server.js`

## Free-Tier Caveats

| Constraint | Detail |
|------------|--------|
| **CPU/RAM** | 0.1 vCPU, 512 MB — sufficient for audio processing |
| **Sleep** | Spins down after 15 min idle (wakes on request, ~30s cold start) |
| **Hours** | 750 hours/month (free web services) |
| **Storage** | Ephemeral filesystem — uploads deleted after each request |
| **Bandwidth** | 100 GB/month included |
| **File Size** | Max 25 MB upload per request |
| **FFmpeg** | Required for audio conversion (@ffmpeg-installer/ffmpeg included) |
| **API Limits** | Shazam's unofficial API may have rate limits |

## Architecture

```
Request → Express (api-server.js) → ST.js (recognizeSong)
                                        ├── fetchToken() → Shazam auth
                                        ├── processAudio() → FFmpeg PCM conversion
                                        ├── SignatureGenerator → FFT fingerprint
                                        └── POST to amp.shazam.com → match
                                    → JSON response
```

The wrapper (`api-server.js`) is **minimal glue code** — the core Shazam logic in `ST.js`, `src/algorithm.js`, and `src/signature-format.js` is used **untouched**.

## Credits

- **ST-Shazam**: [@sheikhtamimlover](https://github.com/sheikhtamimlover) — original audio recognition library
- **Shazam-API wrapper**: [@rahamanleon](https://github.com/rahamanleon) — REST API, deployment config, documentation
- **Deploy skill**: `deploy-on-render` from ClawHub
- **Tech**: Node.js, Express, multer, fluent-ffmpeg, FFT.js

## License

MIT
