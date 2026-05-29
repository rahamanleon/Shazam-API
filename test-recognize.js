const { recognizeSong } = require('./ST.js');

(async () => {
  try {
    const result = await recognizeSong('raabta_test.wav');
    console.log('=== RAW RESULT KEYS ===');
    console.log(JSON.stringify(Object.keys(result)));
    console.log('=== FULL RESULT ===');
    console.log(JSON.stringify(result, null, 2).substring(0, 8000));
  } catch(e) {
    console.error('Error:', e.message);
    if(e.response && e.response.data) console.error('Response:', JSON.stringify(e.response.data).substring(0, 2000));
  }
})();
