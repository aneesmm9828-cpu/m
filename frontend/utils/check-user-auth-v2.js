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

async function checkLogin(email, password) {
  console.log(`Trying to login with ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(`❌ Login failed for ${email}: ${error.message}`);
  } else {
    console.log(`✅ Login successful for ${email}! User ID: ${data.user.id}`);

    // Check if profile exists
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (pError) {
      console.log(`⚠️ Profile fetch error: ${pError.message}`);
    } else if (profile) {
      console.log(`✅ Profile exists:`, profile);
    } else {
      console.log(`❌ Profile DOES NOT exist for this user!`);
    }
  }
}

async function run() {
  await checkLogin('testuser_54004@gmail.com', 'Password123!');
}

run();
