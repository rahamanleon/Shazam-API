const axios = require('axios');

async function testToken() {
    try {
        // 1. Fetch the JSON from GitHub
        const sigResponse = await axios.get('https://raw.githubusercontent.com/sheikhtamimlover/ST-Handlers/refs/heads/main/key.json');
        const { apple_action_signature, x_request_timestamp } = sigResponse.data;
        console.log('Got signature from GitHub');
        console.log('Timestamp:', x_request_timestamp);

        // 2. Try to get the API token
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
        console.log('Token response status:', response.status);
        console.log('Token keys:', Object.keys(response.data));
        if (response.data.token) {
            console.log('Token (first 50 chars):', response.data.token.substring(0, 50) + '...');
        } else {
            console.log('Full response:', JSON.stringify(response.data).substring(0, 500));
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data).substring(0, 500));
        }
    }
}

testToken();
