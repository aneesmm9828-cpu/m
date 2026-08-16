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

async function forceSignup(username, email, password) {
  console.log(`Trying to sign up ${username} (${email})...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        full_name: username
      }
    }
  });

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  console.log(`✅ Auth signup done! User ID: ${data.user.id}`);

  // IMMEDIATELY try to create the profile
  const { error: pError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    username: username,
    full_name: username,
    updated_at: new Date().toISOString()
  });

  if (pError) {
    console.log(`❌ Profile Error: ${pError.message}`);
  } else {
    console.log(`✅ Profile created for ${username}!`);
  }
}

forceSignup('testuser123', 'testuser123@gmail.com', 'Password123!');
