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

async function createDummies() {
  console.log('🧪 Creating 5 Dummy Profiles via API...\n');

  const dummies = [
    { id: '11111111-1111-1111-1111-111111111111', username: 'dummy_1', full_name: 'Dummy One', bio: 'First dummy profile', avatar_url: 'https://i.pravatar.cc/150?u=1' },
    { id: '22222222-2222-2222-2222-222222222222', username: 'dummy_2', full_name: 'Dummy Two', bio: 'Second dummy profile', avatar_url: 'https://i.pravatar.cc/150?u=2' },
    { id: '33333333-3333-3333-3333-333333333333', username: 'dummy_3', full_name: 'Dummy Three', bio: 'Third dummy profile', avatar_url: 'https://i.pravatar.cc/150?u=3' },
    { id: '44444444-4444-4444-4444-444444444444', username: 'dummy_4', full_name: 'Dummy Four', bio: 'Fourth dummy profile', avatar_url: 'https://i.pravatar.cc/150?u=4' },
    { id: '55555555-5555-5555-5555-555555555555', username: 'dummy_5', full_name: 'Dummy Five', bio: 'Fifth dummy profile', avatar_url: 'https://i.pravatar.cc/150?u=5' },
  ];

  for (const profile of dummies) {
    console.log(`Inserting: ${profile.username}...`);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select();

    if (error) {
      console.error(`❌ Error for ${profile.username}:`, error.message);
    } else {
      console.log(`✅ Success! Saved ${profile.username}`);
    }
  }

  console.log('\n🔍 Final Check: Counting profiles in database...');
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting:', countError.message);
  } else {
    console.log(`🏁 Total profiles in database now: ${count}`);
  }
}

createDummies();
