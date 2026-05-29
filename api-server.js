/**
 * Shazam-API — RESTful wrapper for ST-Shazam
 * Reuses existing recognizeSong() from ST.js untouched.
 * 
 * Endpoints:
 *   POST /recognize  — Upload an audio file, get Shazam recognition result
 *   GET  /health     — Health check (for Render)
 *   GET  /           — API info
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { recognizeSong } = require('./ST.js');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── File upload config ─────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp3|wav|ogg|flac|aac|m4a|wma|webm)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed: mp3, wav, ogg, flac, aac, m4a, wma, webm'));
    }
  }
});

// ── Helper: clean up uploaded file ──────────────────────
function cleanup(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
}

// ── Routes ──────────────────────────────────────────────

// Debug: raw Shazam response (no transformation)
app.post('/debug/recognize-raw', (req, res) => {
  upload.single('audio')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No audio file provided.' });

    const filePath = req.file.path;
    try {
      // Don't use recognizeSong's transformation - call internal functions directly
      const { fetchToken, processAudio } = require('./ST.js');
      const { SignatureGenerator } = require('./src/algorithm');
      const { v4: uuidv4 } = require('uuid');
      const axios = require('axios');

      const authKey = await fetchToken();
      const generator = new SignatureGenerator();
      const samples = await processAudio(filePath);
      const signature = generator.getSignature(samples);
      const signatureUri = signature.encodeToUri();

      const deviceId = uuidv4().toUpperCase();
      const sessionId = uuidv4().toUpperCase();

      const requestData = {
        timestamp: Date.now(),
        timezone: "Asia/Dhaka",
        signatures: [{ uri: signatureUri, audioSource: "MIC" }]
      };

      const headers = {
        'Host': 'amp.shazam.com',
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': `Bearer ${authKey}`,
        'X-Shazam-Platform': 'IPHONE',
        'X-Shazam-Appversion': '26.0.0',
        'Priority': 'u=1, i',
        'X-Shazam-Auth-Retry': '0',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Shazam/5817 CFNetwork/3860.200.71 Darwin/25.1.0'
      };

      const queryParams = {
        recognitionType: 'progressive-with-rolling',
        sampling: 'true',
        matchv2t: 'true',
        hidelb: 'true',
        video: 'v3'
      };

      const v2Url = `https://amp.shazam.com/match/v2/en-US/US/iphone/${deviceId}/${sessionId}`;
      const v2resp = await axios.post(v2Url, requestData, { headers, params: queryParams, timeout: 30000 });
      
      // Also try v1
      let v1data = null;
      try {
        const v1Url = `https://amp.shazam.com/match/v1/en-US/US/iphone/${deviceId}/${sessionId}`;
        const v1resp = await axios.post(v1Url, requestData, { headers, params: { ...queryParams, matchv2t: 'false' }, timeout: 15000 });
        v1data = v1resp.data;
      } catch(e) { v1data = { error: e.message }; }

      cleanup(filePath);
      res.json({
        v2_status: v2resp.status,
        v2_response: v2resp.data,
        v1_response: v1data
      });
    } catch (error) {
      cleanup(filePath);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API info
app.get('/', (req, res) => {
  res.json({
    name: 'Shazam API',
    version: '1.1.1',
    description: 'RESTful wrapper for ST-Shazam audio recognition',
    endpoints: {
      POST: '/recognize — Upload an audio file to identify a song',
      GET: '/health — Health check',
      GET: '/ — This info'
    },
    usage: 'curl -F "audio=@song.mp3" https://<your-app>.onrender.com/recognize'
  });
});

// Song recognition
app.post('/recognize', (req, res) => {
  // Use multer inside the route handler for better error control
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Upload error', detail: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided. Use multipart/form-data with field name "audio".' });
    }

    const filePath = req.file.path;
    console.log(`Processing: ${filePath} (${req.file.originalname})`);

    try {
      const result = await recognizeSong(filePath);

      // Clean up after processing
      cleanup(filePath);

      // Format response
      if (result.matches && result.matches.length > 0) {
        const track = result.matches[0].track;
        res.json({
          success: true,
          song: {
            title: track.title || null,
            artist: track.subtitle || null,
            album: track.sections?.[0]?.metadata?.find(m => m.title === 'Album')?.text || null,
            genre: track.genres?.primary || null,
            releaseDate: track.sections?.[0]?.metadata?.find(m => m.title === 'Released')?.text || null,
            label: track.sections?.[0]?.metadata?.find(m => m.title === 'Label')?.text || null,
            image: track.images?.coverarthq || track.images?.coverart || null,
            url: track.url || null,
            shazamId: track.key || null
          }
        });
      } else {
        res.json({
          success: false,
          message: 'No matches found for this audio'
        });
      }
    } catch (error) {
      cleanup(filePath);
      console.error('Recognition error:', error.message);
      res.status(500).json({
        error: 'Recognition failed',
        detail: error.message
      });
    }
  });
});

// ── Error handling ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Shazam-API running on port ${PORT}`);
  console.log(`   Health check: http://0.0.0.0:${PORT}/health`);
  if (process.env.RENDER) {
    console.log(`   🌐 Live URL: https://${process.env.RENDER_EXTERNAL_URL}`);
  }
});

module.exports = app;
