const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env because dotenv might not be global
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase keys in .env file!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCheck() {
  console.log('🚀 Starting Supabase Database Check...\n');

  // 1. Check Profiles Table
  console.log('--- Checking "profiles" table ---');
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .limit(5);

  if (pError) {
    console.error('❌ Error fetching profiles:', pError.message);
    if (pError.message.includes('relation "public.profiles" does not exist')) {
      console.log('💡 HINT: The "profiles" table is missing! Run the SQL commands in Supabase SQL Editor.');
    }
  } else {
    console.log(`✅ Success! Found ${profiles.length} profiles.`);
    if (profiles.length > 0) {
      console.log('Sample Profiles:', JSON.stringify(profiles, null, 2));
    }
  }

  // 2. Check Posts Table
  console.log('\n--- Checking "posts" table ---');
  const { data: posts, error: postError } = await supabase
    .from('posts')
    .select('id, caption, user_id')
    .limit(5);

  if (postError) {
    console.error('❌ Error fetching posts:', postError.message);
  } else {
    console.log(`✅ Success! Found ${posts.length} posts.`);
  }

  // 3. Check Stories Table
  console.log('\n--- Checking "stories" table ---');
  const { data: stories, error: sError } = await supabase
    .from('stories')
    .select('id')
    .limit(1);

  if (sError) {
    console.error('❌ Error fetching stories:', sError.message);
  } else {
    console.log(`✅ Success! Found ${stories.length} stories.`);
  }

  console.log('\n🏁 Diagnostic Finished.');
}

runCheck();
