# ST-Shazam

> **Package Name:** `st-shazam` (npm compatible) | **Display Name:** ST Shazam

A Node.js implementation of Shazam-like audio recognition using advanced audio fingerprinting algorithms. This project can identify songs from audio files by generating acoustic fingerprints and matching them against the Shazam database.

## 🎵 Features

- **Audio Recognition**: Identify songs from audio files (MP3, WAV, etc.)
- **Audio Fingerprinting**: Generate unique acoustic signatures using FFT and peak detection
- **Shazam API Integration**: Match fingerprints against Shazam's vast music database
- **Audio Processing**: Automatic conversion and normalization of audio files

## 📋 Requirements

- Node.js (v14 or higher)
- FFmpeg (automatically installed via @ffmpeg-installer/ffmpeg)

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/sheikhtamimlover/ST-Shazam.git

# Navigate to project directory
cd ST-Shazam

# Install dependencies
npm install
```

## 💻 Usage

### Command Line

```bash
# Recognize a song from an audio file
node ST.js <path_to_audio_file>

# Or use npm start
npm start ./audio.mp3

# Example
node ST.js ./audio.mp3
```

### As a Module

```javascript
const { recognizeSong } = require('st-shazam');
// Or if using locally: const { recognizeSong } = require('./index.js');

async function identify() {
  try {
    const result = await recognizeSong('./your-audio-file.mp3');
    
    if (result.matches && result.matches.length > 0) {
      console.log('Song found!');
      console.log('Title:', result.matches[0].track?.title);
      console.log('Artist:', result.matches[0].track?.subtitle);
    } else {
      console.log('No matches found');
    }
  } catch (error) {
    console.error('Recognition failed:', error);
  }
}

identify();
```

## 🔧 How It Works

1. **Audio Processing**: The input audio is converted to mono 16kHz PCM format using FFmpeg
2. **Fingerprint Generation**: Audio samples are analyzed using FFT to generate a unique acoustic signature
3. **API Request**: The fingerprint is sent to Shazam's API for matching
4. **Result**: Returns song metadata including title, artist, album, and more

## 📦 Dependencies

- **axios**: HTTP client for API requests
- **uuid**: Generate unique device and session IDs
- **fluent-ffmpeg**: Audio processing and format conversion
- **@ffmpeg-installer/ffmpeg**: FFmpeg binary installer
- **fft.js**: Fast Fourier Transform implementation

## 📁 Project Structure

```
ST-Shazam/
├── src/
│   ├── algorithm.js         # Fingerprint generation algorithm
│   ├── signature-format.js  # Signature encoding/decoding
│   └── hanning.js           # Hanning window function
├── ST.js                    # Main entry point (CLI tool)
├── index.js                 # Core module exports (recognizeSong, processAudio)
├── package.json             # Project configuration
└── README.md                # This file
```

## 🔑 API Information

This project uses Shazam's unofficial API with an included authentication token. The package works out of the box without requiring any additional setup or configuration.

## 🎯 Use Cases

- Music identification apps
- Audio recognition services
- Music discovery platforms
- Audio content analysis tools
- Educational projects on audio processing

## ⚠️ Limitations

- Recognition accuracy depends on audio quality
- Requires internet connection for API access
- API rate limits may apply
- Only identifies songs in Shazam's database

## 👨‍💻 Author

**Sheikh Tamim**
- Instagram: [@sheikh.tamim_lover](https://instagram.com/sheikh.tamim_lover)
- GitHub: [@sheikhtamimlover](https://github.com/sheikhtamimlover)

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/sheikhtamimlover/ST-Shazam/issues).

## 🌟 Acknowledgments

- Shazam for their amazing music recognition technology
- The open-source community for the audio processing libraries

---

Made with ❤️ by Sheikh Tamim
