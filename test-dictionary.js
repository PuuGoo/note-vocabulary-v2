/**
 * Test dictionary API with authentication
 */

const fetch = require('node-fetch');

async function testDictionaryLookup() {
  try {
    console.log('Testing dictionary lookup API...\n');

    // Note: This will fail with 401 if not authenticated
    // You need to test from browser where you're logged in
    const response = await fetch('http://localhost:3000/api/v1/dictionary/lookup/test', {
      method: 'GET',
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Error:', error);
    }

    console.log('\n⚠️  Note: You need to be authenticated to use this endpoint.');
    console.log('Please test from your browser while logged in.\n');
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testDictionaryLookup();
