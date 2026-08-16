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

async function testInsert() {
  const id = '00000000-0000-0000-0000-000000000001';
  console.log(`📝 Attempting to insert a story for user: ${id}`);

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: id,
      media_url: 'https://placehold.co/600x400',
      media_type: 'image',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    })
    .select();

  if (error) {
    console.error('❌ Insert Error:', error.message);
  } else {
    console.log('✅ Story inserted successfully!');
    console.log(data);
  }
}

testInsert();
