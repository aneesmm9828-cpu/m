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

async function checkSchema() {
  console.log('🔍 Checking schemas...');

  const tables = ['posts', 'post_media', 'likes', 'comments'];

  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ Success! Columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
      console.log('⚠️ No data found to infer columns.');
      // Try to get one record without limit to see if it helps, or just list
    }
  }
}

checkSchema();
