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
  console.log('📝 Attempting to insert a dummy post with "image" column...');

  // We still need a user_id. Since we can't create one easily,
  // let's try to see if there are ANY users in auth.users by trying to sign up.
  // Wait, I'll just try to use a random UUID and see if it STILL fails on user_id.

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000001',
      caption: 'Test Post v3',
      image: 'https://placehold.co/600x400'
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
