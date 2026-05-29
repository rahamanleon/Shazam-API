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
  console.log(`Shazam-API running on port ${PORT}`);
});

module.exports = app;
