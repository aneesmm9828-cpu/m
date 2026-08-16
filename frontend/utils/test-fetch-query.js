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

async function testFetch() {
  console.log('🔍 Testing complex query...');

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, full_name, avatar_url),
      post_media (media_url, media_type, position),
      likes (user_id),
      comments (id)
    `)
    .limit(1);

  if (error) {
    console.log('❌ Query Error:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
  } else {
    console.log('✅ Query Success!');
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

testFetch();
