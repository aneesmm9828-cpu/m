const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { decode } = require('base64-arraybuffer');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

// Small red dot 1x1 base64 image
const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function testUploads() {
  console.log('🧪 Testing folder-specific upload permissions...\n');

  const folders = ['profiles', 'stories', 'posts'];
  const results = [];

  for (const folder of folders) {
    console.log(`📤 Attempting upload to: media/${folder}/test.png ...`);
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .upload(`${folder}/test_${Date.now()}.png`, decode(testImage), {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error(`❌ ${folder} Failed: ${error.message}`);
        results.push({ folder, success: false, error: error.message });
      } else {
        console.log(`✅ ${folder} Success!`);
        results.push({ folder, success: true });
      }
    } catch (err) {
      console.error(`💥 ${folder} Error: ${err.message}`);
      results.push({ folder, success: false, error: err.message });
    }
  }

  console.log('\n📊 TEST RESULTS:');
  console.table(results);
}

testUploads();
