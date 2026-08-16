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

async function bruteForce() {
  const commonColumns = [
    'user_id', 'caption', 'video_url', 'media_url', 'created_at', 'id', 'likes', 'comments'
  ];

  console.log('🔨 Brute-forcing column names for "reels"...');

  for (const col of commonColumns) {
    const { error } = await supabase.from('reels').select(col).limit(1);
    if (!error) {
      console.log(`✅ FOUND COLUMN: ${col}`);
    }
  }
}

bruteForce();
