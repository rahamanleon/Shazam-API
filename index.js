const { recognizeSong } = require('./ST.js');
const fs = require('fs');

async function identify() {
  try {
    const result = await recognizeSong('./audio.mp3');

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
