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
  console.log('📝 Attempting to insert a dummy post without media_type...');
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000001',
      caption: 'Test Post v2',
      media_url: 'https://placehold.co/600x400'
    })
    .select();

  if (error) {
    console.error('❌ Insert Error:', error.message);
    console.log('Error Detail:', error.details);
  } else {
    console.log('✅ Post inserted successfully!');
    console.log(data);
  }
}

testInsert();
