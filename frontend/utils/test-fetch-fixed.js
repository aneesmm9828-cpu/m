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

async function testFetch() {
  console.log('🔍 Testing fixed fetch logic...');

  try {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url),
        post_media (media_url, media_type, position)
      `)
      .limit(5);

    if (postsError) throw postsError;

    console.log(`✅ Fetched ${posts.length} posts.`);

    if (posts.length > 0) {
        const postIds = posts.map(p => p.id);
        const [likesRes, commentsRes] = await Promise.all([
          supabase.from('likes').select('target_id, user_id').in('target_id', postIds).eq('target_type', 'post'),
          supabase.from('comments').select('target_id').in('target_id', postIds).eq('target_type', 'post')
        ]);

        console.log(`✅ Fetched ${likesRes.data?.length || 0} likes.`);
        console.log(`✅ Fetched ${commentsRes.data?.length || 0} comments.`);
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testFetch();
