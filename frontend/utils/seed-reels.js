const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '09d4e8d4-02d4-4834-ba7b-f5d1944c5751';

async function seedReels() {
  console.log('🎞️ Seeding test reels...');

  const sampleReels = [
    {
      user_id: userId,
      caption: 'Beautiful nature view #travel #nature',
      video_url: 'https://player.vimeo.com/external/370331493.sd.mp4?s=7b9442a5-48b2d10-8b9-4a9-8b'
    },
    {
      user_id: userId,
      caption: 'Coding all night! 💻 #developer #reactnative',
      video_url: 'https://player.vimeo.com/external/494252666.sd.mp4?s=7b9442a5-48b2d10-8b9-4a9-8b'
    },
    {
      user_id: userId,
      caption: 'Workout motivation 💪 #fitness #gym',
      video_url: 'https://player.vimeo.com/external/403444458.sd.mp4?s=7b9442a5-48b2d10-8b9-4a9-8b'
    }
  ];

  const { data, error } = await supabase.from('reels').insert(sampleReels).select();

  if (error) console.error('❌ Error seeding reels:', error.message);
  else console.log(`✅ Successfully seeded ${data.length} reels!`);
}

seedReels();
