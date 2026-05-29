
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
      matchv2t: 'false',
      hidelb: 'true',
      video: 'v3'
    };

    console.log('Sending request to Shazam v2 API...');
    console.log('Device ID:', deviceId);
    console.log('Session ID:', sessionId);
    console.log('Signature URI length:', signatureUri.length);

    const response = await axios.post(url, requestData, {
      headers: headers,
      params: queryParams
    });

    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);

    const data = response.data;
    
    // Log full response for debugging when matches exist
    if (data && data.results && data.results.matches && data.results.matches.length > 0) {
      console.log('MATCH FOUND! Match ID:', data.results.matches[0].id);
      console.log('Response top-level keys:', Object.keys(data));
      console.log('Has results:', !!data.results);
      console.log('Has resources:', !!data.resources);
      console.log('Has meta:', !!data.meta);
      console.log('Full match object:', JSON.stringify(data.results.matches[0]));
      console.log('Results full:', JSON.stringify(data.results).substring(0, 3000));
      if (data.resources) {
        console.log('Resource types:', Object.keys(data.resources));
        console.log('Full resources:', JSON.stringify(data.resources, null, 2).substring(0, 5000));
      } else {
        console.log('NO RESOURCES in v2 response');
        // The track data might be embedded differently
        console.log('Checking alternate data paths...');
        console.log('Full data:', JSON.stringify(data, null, 2).substring(0, 8000));
      }
    } else {
      console.log('No matches or different structure. Full response:', JSON.stringify(data, null, 2).substring(0, 3000));
    }

    // Transform Shazam API v2 response into the expected format
    if (data && data.results && data.results.matches && data.results.matches.length > 0) {
      const match = data.results.matches[0];
      const songId = match.id;
      const songType = match.type || 'shazam-songs';
      
      // Track data in v2 is under resources.[type].[id].attributes
      let trackData = data.resources?.[songType]?.[songId];
      let attrs = trackData?.attributes || null;
      
      // Also get album info from resources if available
      let albumData = null;
      if (trackData?.relationships?.albums?.data?.[0]) {
        const albumRel = trackData.relationships.albums.data[0];
        albumData = data.resources?.[albumRel.type]?.[albumRel.id];
      }
      
      // Log what we found  
      console.log('Match:', songId, 'Title:', attrs?.title, 'Artist:', attrs?.artist);
      console.log('Album:', albumData?.attributes?.name);
      
      const transformed = {
        matches: [{
          track: {
            key: songId,
            title: attrs?.title || null,
            subtitle: attrs?.artist || attrs?.subtitle || null,
            images: attrs?.images || null,
            url: attrs?.webUrl || match.href || null,
            genres: attrs?.genres || null,
            label: attrs?.label || null,
            album: albumData?.attributes?.name || null,
            releaseDate: albumData?.attributes?.releaseDate || null,
            share: attrs?.share || null,
            streaming: attrs?.streaming || null
          }
        }],
        _meta: data.meta || null
      };
      
      console.log('Transformed:', JSON.stringify(transformed).substring(0, 500));
      return transformed;
    }

    // Return as-is if no matches found
    return data;
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
module.exports = { recognizeSong, processAudio, fetchToken };
