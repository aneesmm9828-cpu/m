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

async function checkUser() {
  const email = 'testuser_54004@gmail.com';
  console.log(`Checking if user ${email} exists in profiles...`);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'dummy_1738647895085') // I used Date.now() for username in the script
    .maybeSingle();

  if (error) {
    console.error('❌ Error:', error.message);
  } else if (data) {
    console.log('✅ User found in profiles:', data);
  } else {
    console.log('❌ User not found in profiles.');

    // List some profiles
    const { data: profiles } = await supabase.from('profiles').select('username').limit(5);
    console.log('Existing usernames:', profiles.map(p => p.username));
  }
}

checkUser();
