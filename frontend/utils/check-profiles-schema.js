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
  console.log('🧐 Checking "profiles" table schema...');

  // Try to insert a row and see if it fails due to schema mismatch
  const testId = '00000000-0000-0000-0000-000000000001';
  const { error } = await supabase
    .from('profiles')
    .insert({ id: testId, username: 'test_user_' + Date.now() });

  if (error) {
    console.error('❌ Schema Error:', error.message);
    console.log('Error Detail:', error.details);
  } else {
    console.log('✅ Basic insert successful. Schema seems OK.');
    // Cleanup
    await supabase.from('profiles').delete().eq('id', testId);
  }
}

checkSchema();
