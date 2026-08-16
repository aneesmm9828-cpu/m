const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const anonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

async function testFunc() {
  console.log('Testing Edge Function: generate-zego-token...');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-zego-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}` // Testing with anon key, though usually needs user JWT
      },
      body: JSON.stringify({ roomId: 'test_room' })
    });

    console.log('Status:', response.status);
    const body = await response.text();
    console.log('Response Body:', body);

    if (response.status === 404) {
      console.log('❌ Edge Function NOT FOUND. You need to deploy it.');
    } else if (response.status === 401) {
      console.log('✅ Edge Function EXISTS (returned 401 as expected for anon key).');
    } else if (response.status === 200) {
      console.log('✅ Edge Function is WORKING PERFECTLY.');
    }
  } catch (err) {
    console.error('❌ Fetch Error:', err.message);
  }
}

testFunc();
