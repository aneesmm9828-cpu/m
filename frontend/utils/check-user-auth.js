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

async function checkAuth() {
  console.log('Checking Auth users (requires service role or admin privileges, but we try with anon key to see if any info leaks or if we can sign in)...');

  // Since we can't list users with anon key, we'll try to sign in with a few common emails if user provided any
  // But wait, I can just try to see if the profile exists for the user ID I created.

  const { data: profiles, error } = await supabase.from('profiles').select('id, username').limit(10);
  if (error) {
    console.error('Error fetching profiles:', error.message);
    return;
  }

  console.log('Total profiles found:', profiles.length);
  profiles.forEach(p => {
    console.log(`- ID: ${p.id}, Username: ${p.username}`);
  });
}

checkAuth();
