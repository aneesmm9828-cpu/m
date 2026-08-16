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

async function checkCurrentProfile() {
  console.log('🔍 Fetching most recently updated profiles...\n');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    if (data && data.length > 0) {
      data.forEach(profile => {
        console.log(`👤 User: ${profile.username || 'N/A'} (${profile.id})`);
        console.log(`🖼️ Avatar URL: ${profile.avatar_url ? profile.avatar_url.substring(0, 50) + '...' : 'EMPTY'}`);
        console.log(`🕒 Updated At: ${profile.updated_at}`);
        console.log('-------------------');
      });
    } else {
      console.log('⚠️ No profiles found.');
    }
  }
}

checkCurrentProfile();
