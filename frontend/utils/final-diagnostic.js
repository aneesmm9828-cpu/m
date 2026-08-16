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

async function runDiagnostic() {
  console.log('🧪 --- FINAL SUPABASE LOGIN DIAGNOSTIC --- 🧪\n');

  const email = 'testuser_54004@gmail.com';
  const password = 'Password123!';

  console.log(`1. Testing Connection to: ${supabaseUrl}`);
  const { data: health, error: healthError } = await supabase.from('profiles').select('count').limit(0);
  if (healthError) {
    console.log(`❌ Connection Issue: ${healthError.message}`);
  } else {
    console.log(`✅ Connection OK.`);
  }

  console.log(`\n2. Attempting Login for: ${email}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.log(`❌ LOGIN FAILED: "${authError.message}"`);
    console.log(`💡 Hint: If it still says "Email logins are disabled", the setting change didn't save in Supabase.`);
    console.log(`💡 Hint: If it says "Invalid login credentials", the user doesn't exist or password is wrong.`);
    console.log(`💡 Hint: If it says "Email not confirmed", the "Confirm Email" switch is still ON.`);
  } else {
    console.log(`✅ LOGIN SUCCESSFUL! User ID: ${authData.user.id}`);

    console.log(`\n3. Checking Profile for ID: ${authData.user.id}`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.log(`❌ Profile Error: ${profileError.message}`);
    } else if (profile) {
      console.log(`✅ Profile Found: ${JSON.stringify(profile)}`);
    } else {
      console.log(`❌ Profile NOT FOUND. The app will get stuck if the profile is missing!`);

      console.log(`\n4. Attempting to FIX missing profile...`);
      const { error: fixError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: `user_${Math.floor(Math.random() * 1000)}`,
        full_name: 'Fixed User'
      });

      if (fixError) console.log(`❌ Fix Failed: ${fixError.message}`);
      else console.log(`✅ Profile Created Successfully!`);
    }
  }
}

runDiagnostic();
