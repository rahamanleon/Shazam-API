# Shazam-API 🎵

> Production-ready RESTful API for audio recognition — upload a song clip, get back title, artist, album, and artwork.
> Powered by acoustic fingerprinting matched against Shazam's database.

## Features

- 🎵 **Audio Recognition** — identify songs from short clips
- 🖼️ **Album Artwork** — returned with every match
- ⚡ **Fast** — sub-second recognition for clean recordings
- 🌐 **REST API** — simple HTTP interface
- 🚀 **Deploy anywhere** — Node.js, Render, Railway, VPS

## Quick Start

```bash
npm install
npm start
```

## API Usage

```bash
# Upload an audio file for recognition
curl -X POST -F "audio=@song.mp3" http://localhost:3000/recognize

# Response:
# {
#   "matches": [{
#     "track": {
#       "title": "Song Title",
#       "subtitle": "Artist Name",
#       "images": { "coverarthq": "https://..." }
#     }
#   }]
# }
```

## Deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## Requirements

- Node.js 18+
- audio.mp3 or similar test file for development

## License

MIT &mdash; see [LICENSE](LICENSE).


---

## 📬 Contact

- **Author**: [Rahaman Leon](https://github.com/rahamanleon)
- **Email**: rahamanleon16@gmail.com
- **Repository**: [https://github.com/rahamanleon/Shazam-API](https://github.com/rahamanleon/Shazam-API)
- **Issues**: [https://github.com/rahamanleon/Shazam-API/issues](https://github.com/rahamanleon/Shazam-API/issues)
- **GitHub**: [https://github.com/rahamanleon](https://github.com/rahamanleon)
