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

async function bruteForce() {
  const commonColumns = [
    'user_id', 'caption', 'media_url', 'media_type', 'created_at', 'updated_at',
    'image', 'video', 'url', 'content', 'body', 'text', 'title', 'description',
    'likes_count', 'comments_count', 'post_id', 'owner_id', 'author_id',
    'id', 'media', 'image_url', 'video_url', 'asset_url', 'attachment', 'file_path',
    'thumbnail', 'location', 'tags', 'metadata', 'slug', 'type'
  ];

  console.log('🔨 Brute-forcing column names for "posts"...');

  for (const col of commonColumns) {
    const { error } = await supabase.from('posts').select(col).limit(1);
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        // console.log(`❌ ${col} does not exist`);
      } else {
        console.log(`⚠️ ${col}: ${error.message}`);
      }
    } else {
      console.log(`✅ FOUND COLUMN: ${col}`);
    }
  }
}

bruteForce();
