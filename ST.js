
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

    // Transform response - handle both v2 and v1 formats
    if (data && data.results && data.results.matches && data.results.matches.length > 0) {
      const match = data.results.matches[0];
      const songId = match.id;
      const songType = match.type || 'shazam-songs';
      
      // Try embedded resources first (v2 with resources)
      let trackData = data.resources?.[songType]?.[songId];
      
      // Try alternate resource paths
      if (!trackData && data.resources) {
        console.log('Trying alternate resource paths...');
        for (const type of Object.keys(data.resources)) {
          if (data.resources[type]?.[songId]) {
            trackData = data.resources[type][songId];
            console.log('Found in', type);
            break;
          }
        }
      }
      
      // Try embedded track data directly in match
      if (!trackData && match.track) {
        console.log('Using match.track');
        trackData = match.track;
      }
      
      // If no embedded resources, and this is v2 response with track data in a different format
      if (!trackData && data.meta?.track) {
        trackData = data.meta.track;
      }
      
      // Fetch track details from href URL if available
      if (!trackData && match.href) {
        try {
          console.log('Fetching track details from:', match.href);
          const trackResponse = await axios.get(match.href, {
            headers: {
              'User-Agent': 'Shazam/16.39.0 Android/12 model/Tcl5033D build/1603900 AMS/1',
              'Accept': 'application/json'
            },
            timeout: 10000
          });
          trackData = trackResponse.data;
          console.log('Track response keys:', Object.keys(trackData));
        } catch (fetchErr) {
          console.error('Failed to fetch track details:', fetchErr.message);
        }
      }

      // Fallback to v1 API if no track data found (v2 didn't include it)
      if (!trackData && !data.resources) {
        console.log('No resources in v2 response - trying v1 match API...');
        try {
          const v1headers = { ...headers, 'Host': 'amp.shazam.com' };
          const v1Url = `https://amp.shazam.com/match/v1/en-US/US/iphone/${deviceId}/${sessionId}`;
          const v1resp = await axios.post(v1Url, requestData, { headers: v1headers, params: queryParams, timeout: 15000 });
          const v1data = v1resp.data;
          console.log('V1 Status:', v1resp.status);
          console.log('V1 response:', JSON.stringify(v1data, null, 2).substring(0, 5000));
          
          if (v1data && v1data.matches && v1data.matches.length > 0) {
            const v1match = v1data.matches[0];
            if (v1match.track) {
              trackData = v1match.track;
              console.log('Got track data from v1 API!');
            }
          }
        } catch (v1err) {
          console.error('V1 fallback failed:', v1err.message);
        }
      }

      const transformed = {
        matches: [{
          track: {
            key: songId,
            title: trackData?.title || null,
            subtitle: trackData?.subtitle || trackData?.artist || null,
            images: trackData?.images || null,
            url: trackData?.url || match.href || null,
            genres: trackData?.genres || null,
            sections: trackData?.sections || null
          }
        }],
        _meta: data.meta || null
      };
      
      console.log('Transformed response (first 500 chars):', JSON.stringify(transformed).substring(0, 500));
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
