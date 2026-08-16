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

async function createConfirmedUser() {
  const email = `confirmed_${Math.floor(Math.random() * 10000)}@gmail.com`;
  const password = 'Password123!';

  console.log(`🚀 Creating a NEW user with current settings: ${email}`);

  // Since "Confirm Email" is now OFF (hopefully), this user should be auto-confirmed
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.log(`❌ Signup failed: ${error.message}`);
  } else {
    console.log(`✅ Signup SUCCESS! User ID: ${data.user.id}`);
    console.log(`Status: ${data.user.confirmed_at ? 'CONFIRMED' : 'NOT CONFIRMED'}`);

    if (!data.user.confirmed_at) {
        console.log('⚠️ Warning: User is STILL NOT confirmed. This means "Confirm Email" is still ON in Supabase settings.');
    } else {
        console.log('🎉 SUCCESS! The setting is correctly OFF. Now creating profile...');
        const { error: pError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: `user_${Math.floor(Math.random() * 10000)}`,
            full_name: 'Confirmed User'
        });
        if (pError) console.log(`❌ Profile Error: ${pError.message}`);
        else console.log(`✅ Profile Created! You can now login with: ${email} / Password123!`);
    }
  }
}

createConfirmedUser();
