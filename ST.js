
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { SignatureGenerator } = require('./src/algorithm');
const { DecodedMessage } = require('./src/signature-format');

ffmpeg.setFfmpegPath(ffmpegPath);

// Function to convert audio to the required format (16-bit PCM mono 16kHz)
async function processAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const outputPath = './temp_audio.raw';

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
      'Authorization': 'Bearer eyJraWQiOiJCOERFQ1pQVksxIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJYS1FLM1ZPU0QxIiwiaWF0IjoxNzYyMTkwNTgwLCJleHAiOjE3NjQ3ODI1ODB9.CYS5nwARbcS9P3i5CAZe03Vfoj5Gb7BN1M0z6rYKfnTWAu28HSKq5IUH0gyHtZbjOjkIcLT2XdgfjCti_1cBHg',
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
    console.log('Data:', JSON.stringify(response.data, null, 2));

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
