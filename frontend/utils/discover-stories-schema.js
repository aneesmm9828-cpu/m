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

async function discoverSchema() {
  console.log('🔍 Discovering columns for "stories" table...');

  const { data, error } = await supabase
    .from('stories')
    .insert({
      media_url: 'https://placehold.co/600x400'
    })
    .select();

  if (error) {
    console.log('Error message:', error.message);
    console.log('Error detail:', error.details);
  } else {
    console.log('✅ Success! Found columns:', Object.keys(data[0]).join(', '));
  }
}

discoverSchema();
