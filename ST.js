
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { SignatureGenerator } = require('./src/algorithm');
const { DecodedMessage } = require('./src/signature-format');

ffmpeg.setFfmpegPath(ffmpegPath);

// Function to fetch the authentication token
async function fetchToken() {
    const signatureUrl = 'https://raw.githubusercontent.com/sheikhtamimlover/ST-Handlers/refs/heads/main/key.json';

    try {
        // 1. Fetch the JSON from GitHub
        const sigResponse = await axios.get(signatureUrl);
        const { apple_action_signature, x_request_timestamp } = sigResponse.data;

        // 2. Setup the request using both values from the JSON
        const config = {
            method: 'GET',
            url: 'https://sf-api-token-service.itunes.apple.com/apiToken?clientClass=apple&clientId=com.shazam.android&inid=AC3B3EB2-E6A6-4BF6-AA47-14C54F1E79C8',
            headers: {
                'User-Agent': 'Shazam/16.39.0 Android/12 model/Tcl5033D build/1603900 AMS/1',
                'x-apple-actionsignature': apple_action_signature,
                'x-request-timestamp': x_request_timestamp,
                'x-apple-tz': '21600',
                'x-apple-store-front': '143441-1,31',
                'x-apple-client-application': 'com.shazam.android',
                'Accept-Encoding': 'gzip'
            }
        };

        const response = await axios.request(config);
        return response.data.token || response.data;

    } catch (error) {
        console.error('Error fetching token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to convert audio to the required format (16-bit PCM mono 16kHz)
async function processAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(os.tmpdir(), 'temp_audio_' + Date.now() + '.raw');

    // Convert audio to 16-bit PCM mono 16kHz
    ffmpeg(audioPath)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('s16le')
      .on('end', () => {
        try {
          const audioBuffer = fs.readFileSync(outputPath);
          const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);

          // Clean up temp file
          fs.unlinkSync(outputPath);

          console.log(`Processed ${samples.length} audio samples`);
          resolve(samples);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}

async function recognizeSong(audioPath) {
  try {
    
    const authKey = await fetchToken();

    // Generate signature from audio
    const generator = new SignatureGenerator();
    const samples = await processAudio(audioPath);
    const signature = generator.getSignature(samples);
    const signatureUri = signature.encodeToUri();

    // Generate UUIDs for the request
    const deviceId = uuidv4().toUpperCase();
    const sessionId = uuidv4().toUpperCase();

    // Prepare request data
    const requestData = {
      timestamp: Date.now(),
      timezone: "Asia/Dhaka",
      signatures: [{
        uri: signatureUri,
        audioSource: "MIC"
      }]
    };

    // Prepare headers
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

    // Make the request
    const url = `https://amp.shazam.com/match/v2/en-US/US/iphone/${deviceId}/${sessionId}`;
    const queryParams = {
      recognitionType: 'progressive-with-rolling',
      sampling: 'true',
      matchv2t: 'true',
      hidelb: 'true',
      video: 'v3'
    };

    console.log('Sending request to Shazam API...');
    console.log('Device ID:', deviceId);
    console.log('Session ID:', sessionId);
    console.log('Signature URI length:', signatureUri.length);

    const response = await axios.post(url, requestData, {
      headers: headers,
      params: queryParams
    });

    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
    
    // Add debug info to response
    if (response.data) {
      response.data._debug = {
        status: response.status,
        hasMatches: 'matches' in response.data,
        matchCount: response.data.matches ? response.data.matches.length : 0,
        matchKeys: response.data.matches && response.data.matches[0] ? Object.keys(response.data.matches[0]) : null
      };
    }

    return response.data;
  } catch (error) {
    console.error('Error recognizing song:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Export for use as a module
module.exports = { recognizeSong, processAudio };
