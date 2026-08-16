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

async function signup() {
  const email = `testuser_${Math.floor(Math.random() * 100000)}@gmail.com`;
  const password = 'Password123!';

  console.log(`Attempting to sign up ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('❌ Signup Error:', error.message);
  } else {
    console.log('✅ Signup Successful!');
    console.log('User ID:', data.user.id);

    // Now try to create a profile for this user
    console.log('Attempting to create profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: `dummy_${Date.now()}`,
        full_name: 'Dummy User'
      });

    if (profileError) {
      console.error('❌ Profile Error:', profileError.message);
    } else {
      console.log('✅ Profile Created!');
    }
  }
}

signup();
