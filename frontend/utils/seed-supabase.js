const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to find .env file
const envPath = path.join(__dirname, '../.env');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const getEnvVar = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
  };
  supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
  supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Fallback or manual entry
supabaseUrl = supabaseUrl || 'YOUR_SUPABASE_URL';
supabaseKey = supabaseKey || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ Error: Supabase URL/Key missing. Update .env or manual entry in seed-supabase.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IMPORTANT: Replace this with a valid User ID from your Supabase Auth (auth.users)
const userId = '09d4e8d4-02d4-4834-ba7b-f5d1944c5751';

async function seed() {
  console.log(`🌱 Seeding data for user: ${userId}\n`);

  // 0. Ensure Profile exists
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    username: 'seed_user',
    full_name: 'Seed Test User'
  });
  if (profileError) console.error('❌ Profile Error:', profileError.message);

  // 1. Insert Posts
  console.log('📦 Inserting Posts...');
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert([
      { user_id: userId, caption: 'Enjoying the view!', location: 'New York' },
      { user_id: userId, caption: 'Coding late at night...', location: 'Home Office' }
    ])
    .select();

  if (postError) {
    console.error('❌ Post Error:', postError.message);
  } else {
    console.log('✅ Posts inserted!');
    // 2. Insert Post Media (CRITICAL for feed)
    console.log('🖼️ Inserting Post Media...');
    const mediaEntries = postData.map((post, index) => ({
      post_id: post.id,
      media_url: index === 0
        ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
        : 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      media_type: 'image',
      position: 0
    }));

    const { error: mediaError } = await supabase.from('post_media').insert(mediaEntries);
    if (mediaError) console.error('❌ Media Error:', mediaError.message);
    else console.log('✅ Post Media inserted!');
  }

  // 3. Insert Stories
  console.log('\n🎬 Inserting Stories...');
  const { data: storyData, error: storyError } = await supabase
    .from('stories')
    .insert([
      {
        user_id: userId,
        media_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
        media_type: 'image',
        expires_at: new Date(Date.now() + 86400000).toISOString()
      }
    ])
    .select();

  if (storyError) console.error('❌ Story Error:', storyError.message);
  else console.log('✅ Stories inserted!');

  // 4. Insert Reels
  console.log('\n🎞️ Inserting Reels...');
  const { data: reelData, error: reelError } = await supabase
    .from('reels')
    .insert([
      {
        user_id: userId,
        caption: 'First Reel! #fun',
        video_url: 'https://player.vimeo.com/external/370331493.sd.mp4?s=7b9442a5-48b2d10-8b9-4a9-8b'
      }
    ])
    .select();

  if (reelError) console.error('❌ Reel Error:', reelError.message);
  else console.log('✅ Reels inserted!');

  console.log('\n🏁 Seeding complete!');
}

seed();
