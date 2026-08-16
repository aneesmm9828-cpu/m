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

async function attemptCreateBucket() {
  console.log('🏗️ Attempting to create "media" bucket using Anon Key...\n');

  try {
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('new row violates row-level security policy')) {
        console.log('\n💡 Analysis: The Anon Key does not have permission to create buckets.');
        console.log('You must create the bucket manually in the Supabase Dashboard.');
      }
    } else {
      console.log('✅ SUCCESS! Bucket "media" created.');
      console.log(data);
    }
  } catch (err) {
    console.error('💥 Unexpected Error:', err.message);
  }
}

attemptCreateBucket();
