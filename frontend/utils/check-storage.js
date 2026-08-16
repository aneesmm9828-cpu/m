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

async function checkStorage() {
  console.log('📦 Checking Supabase Storage...\n');

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError.message);
  } else {
    console.log('✅ Buckets found:');
    buckets.forEach(b => {
      console.log(`- ${b.name} (Public: ${b.public})`);
    });

    const mediaBucket = buckets.find(b => b.name === 'media');
    if (mediaBucket) {
        console.log('\n📂 Files in "media" bucket (profiles/):');
        const { data: files, error: filesError } = await supabase.storage.from('media').list('profiles', { limit: 10 });
        if (filesError) {
            console.error('❌ Error listing files:', filesError.message);
        } else {
            files.forEach(f => {
                console.log(`- ${f.name}`);
            });
        }
    } else {
        console.log('\n❌ "media" bucket NOT FOUND.');
    }
  }
}

checkStorage();
