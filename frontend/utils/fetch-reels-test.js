const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchReels() {
  console.log('🎞️ Fetching reels...');
  const { data, error } = await supabase.from('reels').select('*');
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log(`✅ Found ${data.length} reels.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

fetchReels();
